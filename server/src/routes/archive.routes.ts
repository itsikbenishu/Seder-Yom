import { Router } from "express";
import { z } from "zod";
import { archiveDayQuerySchema, archiveQuerySchema } from "@project/shared";
import { deleteArchivedDay, getArchive, postArchiveDay } from "../controllers/archive.controller.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

const dayOfWeekParamsSchema = z.object({ dayOfWeek: z.coerce.number().int().min(0).max(6) });
const idParamsSchema = z.object({ id: z.uuid() });

export const archiveRouter = Router();

archiveRouter.use(requireAuth);
archiveRouter.use(rateLimitMiddleware);

archiveRouter.get("/", validate({ query: archiveQuerySchema }), getArchive);
archiveRouter.post("/:dayOfWeek", validate({ params: dayOfWeekParamsSchema, query: archiveDayQuerySchema }), postArchiveDay);
archiveRouter.delete("/:id", validate({ params: idParamsSchema }), deleteArchivedDay);
