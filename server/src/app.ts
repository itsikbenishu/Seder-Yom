import { createRequire } from "node:module";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { logger } from "./config/logger.js";
import { correlationIdMiddleware } from "./routes/middlewares/correlationId.middleware.js";
import { errorHandlerMiddleware } from "./routes/middlewares/errorHandler.middleware.js";
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
app.use(cors());
app.use(express.json());
app.use(correlationIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as unknown as { correlationId: string }).correlationId,
  }),
);

app.use("/api/v1/events", eventsRouter);

app.use(errorHandlerMiddleware);
