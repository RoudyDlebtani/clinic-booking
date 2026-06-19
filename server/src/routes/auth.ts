import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { doctors, users } from "../db/schema";
import { hashPassword, requireAuth, signToken, verifyPassword } from "../auth";
import { asyncHandler, HttpError } from "../lib/http";
import { loginSchema, signupSchema } from "../lib/validation";

export const authRouter = Router();

const publicUser = {
  id: users.id,
  email: users.email,
  full_name: users.full_name,
  phone: users.phone,
  role: users.role,
};

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const email = parsed.data.email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    if (existing) throw new HttpError(409, "An account with that email already exists.");

    const password_hash = await hashPassword(parsed.data.password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        password_hash,
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      })
      .returning(publicUser);

    // Doctor accounts get a bookable profile linked to their login. They fill in
    // specialty, fee, visit length and working hours later via the profile editor.
    if (parsed.data.role === "doctor") {
      await db
        .insert(doctors)
        .values({ user_id: user.id, name: parsed.data.fullName });
    }

    res.status(201).json({ token: signToken(user.id), user });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid email or password.");
    const email = parsed.data.email.toLowerCase();

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
      throw new HttpError(401, "Invalid email or password.");
    }

    res.json({
      token: signToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
    });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [user] = await db
      .select(publicUser)
      .from(users)
      .where(eq(users.id, req.userId!));
    if (!user) throw new HttpError(404, "User not found.");
    res.json({ user });
  }),
);
