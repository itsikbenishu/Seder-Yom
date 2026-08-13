import { createRequire } from "node:module";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { correlationIdMiddleware } from "./routes/middlewares/correlationId.middleware.js";
import { errorHandlerMiddleware } from "./routes/middlewares/errorHandler.middleware.js";
import { archiveRouter } from "./routes/archive.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { eventsRouter } from "./routes/events.routes.js";

// pino-http ships as CommonJS without an "exports" map; under real Node ESM (this
// package has "type": "module"), `import pinoHttp from "pino-http"` resolves to the
// module namespace object, not the callable function, and TS's `import x = require()`
// only type-checks — it doesn't polyfill `require` at runtime here. `createRequire`
// is the actual working escape hatch for this CJS-interop gap.
const require = createRequire(import.meta.url);
const pinoHttp: typeof import("pino-http").default = require("pino-http");

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(correlationIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as unknown as { correlationId: string }).correlationId,
  }),
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/archive", archiveRouter);

app.use(errorHandlerMiddleware);
