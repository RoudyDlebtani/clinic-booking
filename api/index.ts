// Vercel serverless entry. @vercel/node serves a default-exported Express app.
// All `/api/*` requests are routed here (see vercel.json); the Express app
// matches the original URL, e.g. `/api/auth/login`.
import app from "../server/src/app";

export default app;
