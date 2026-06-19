import app from "./app";
import { config } from "./config";

/**
 * Local development entry point: starts a long-lived HTTP server. In production
 * the app is served by Vercel as a serverless function (see /api/index.ts), so
 * this file is not used there.
 */
app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
