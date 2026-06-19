import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { config } from "./config";
import { HttpError } from "./lib/http";
import { authRouter } from "./routes/auth";
import { catalogRouter } from "./routes/catalog";
import { appointmentsRouter } from "./routes/appointments";
import { doctorRouter } from "./routes/doctor";

const app = express();

app.use(cors({ origin: config.webOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

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

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
