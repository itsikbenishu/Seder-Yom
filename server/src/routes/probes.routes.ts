import { Router } from "express";
import { getLiveness, getReadiness } from "../controllers/probes.controller.js";

// Operational probes for Docker/K8s — not part of the /api/v1 product surface, so no
// auth, no rate limit, mounted at root. Paths follow the k8s convention (and CLAUDE.md §4):
//   /healthz -> liveness  (process alive? fail => restart the container)
//   /readyz  -> readiness (deps reachable? 503 => hold traffic, don't restart)
// docker-compose wires the server healthcheck to /readyz; client & worker wait for it.
export const probesRouter = Router();

probesRouter.get("/healthz", getLiveness);
probesRouter.get("/readyz", getReadiness);
