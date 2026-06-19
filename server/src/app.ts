import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { config } from "./config";
import { HttpError } from "./lib/http";
import { authRouter } from "./routes/auth";
import { catalogRouter } from "./routes/catalog";
import { appointmentsRouter } from "./routes/appointments";
import { doctorRouter } from "./routes/doctor";

/**
 * Builds the Express app. Exported (without `app.listen`) so it can run both as
 * a long-lived local server (see index.ts) and as a Vercel serverless function
 * (see /api/index.ts). On Vercel the app is served at the same origin as the
 * frontend, so CORS never actually triggers.
 */
const app = express();

app.use(cors({ origin: config.webOrigin }));
app.use(express.json());

// Health check. The `/api/health` form is the one reachable in production,
// since only `/api/*` is routed to this function (everything else is the SPA).
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api", catalogRouter);
app.use("/api/appointments", appointmentsRouter);

// 404 for unknown API routes.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Central error handler — turns HttpError into its status, everything else 500.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

export default app;
