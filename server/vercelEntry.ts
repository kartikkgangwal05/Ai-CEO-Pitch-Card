// Vercel serverless entry (bundled to api/index.js by `npm run build:api`).
// Every /api/* request is handled by the Express app in server.ts.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server.ts';

const appReady = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appReady;
  app(req, res);
}
