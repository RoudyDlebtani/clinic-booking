import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { config } from "./config";
import { asyncHandler, HttpError } from "./lib/http";
import { db } from "./db/client";
import { doctors } from "./db/schema";

const TOKEN_TTL = "7d";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: TOKEN_TTL });
}

/**
 * Express middleware that requires a valid Bearer token and attaches the
 * authenticated user id to `req.userId`. Replaces Supabase's RLS-via-cookie
 * model: the API itself now decides who the caller is.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "You must be signed in.");
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const sub = typeof payload === "object" ? payload.sub : undefined;
    if (typeof sub !== "string") throw new Error("bad token");
    req.userId = sub;
    next();
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
}

/**
 * Express middleware (use after requireAuth) that restricts a route to doctor
 * accounts. Resolves the doctor profile linked to the signed-in user and
 * attaches its id to `req.doctorId`; 403 if the user has no doctor profile.
 */
export const requireDoctor = asyncHandler(async (req, _res, next) => {
  const [doctor] = await db
    .select({ id: doctors.id })
    .from(doctors)
    .where(eq(doctors.user_id, req.userId!));

  if (!doctor) throw new HttpError(403, "This area is for doctor accounts only.");
  req.doctorId = doctor.id;
  next();
});
