import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { sendError } from "../../utils/apiResponse.js";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;

// Per-user rate limiting. Keyed by the authenticated `req.userId` when
// available; falls back to the client IP (normalized via `ipKeyGenerator` for safe IPv6
// handling) for routes reached before authentication, e.g. login/verify.
export const rateLimitMiddleware = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_REQUESTS_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId ?? ipKeyGenerator(req.ip ?? "unknown"),
  handler: (_req, res) => {
    sendError(res, 429, "RATE_LIMITED", "Too many requests, please try again later.");
  },
});
