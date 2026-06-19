import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./app";

/**
 * Vercel serverless handler. This file is bundled by esbuild into a single
 * self-contained `api/index.js` (see the root `build:api` script) so the
 * function has no runtime module resolution — which is what broke when Vercel
 * compiled the ESM server files individually. Express apps are themselves
 * `(req, res)` handlers, so we just delegate to it.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(
    req,
    res,
  );
}
