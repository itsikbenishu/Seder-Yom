import { Router } from "express";
import { z } from "zod";
import { archiveQuerySchema } from "@project/shared";
import { getArchive, postArchiveDay } from "../controllers/archive.controller.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

const dayOfWeekParamsSchema = z.object({ dayOfWeek: z.coerce.number().int().min(0).max(6) });

export const archiveRouter = Router();

archiveRouter.use(requireAuth);

archiveRouter.get("/", validate({ query: archiveQuerySchema }), getArchive);
archiveRouter.post("/:dayOfWeek", validate({ params: dayOfWeekParamsSchema }), postArchiveDay);
