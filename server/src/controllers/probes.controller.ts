import type { Request, Response } from "express";
import { checkReadiness } from "../services/probes.service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

// Liveness: "is this Node process running and answering HTTP?" — no I/O, always 200.
// A failure here means the process is hung/crashed; the orchestrator should restart it.
export function getLiveness(_req: Request, res: Response): void {
  sendSuccess(res, { status: "ok" });
}

// Readiness: "can the server actually serve a full request?" — probes Postgres + RabbitMQ.
// A 503 here means a dependency is down; stop routing traffic here, but do NOT restart.
export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const { ready, checks } = await checkReadiness();

  if (!ready) {
    sendError(res, 503, "NOT_READY", `Dependencies not ready: ${JSON.stringify(checks)}`);
    return;
  }

  sendSuccess(res, checks);
}
