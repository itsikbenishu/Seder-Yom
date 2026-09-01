import { Router } from "express";
import { z } from "zod";
import { createEventSchema, updateEventSchema } from "@project/shared";
import {
  clearDayEvents,
  deleteEventById,
  getEvents,
  muteDayEvents,
  patchEvent,
  postEvent,
  unmuteDayEvents,
} from "../controllers/events.controller.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

const idParamsSchema = z.object({ id: z.uuid() });
const dayOfWeekParamsSchema = z.object({ dayOfWeek: z.coerce.number().int().min(0).max(6) });

export const eventsRouter = Router();

eventsRouter.use(requireAuth);
eventsRouter.use(rateLimitMiddleware);

eventsRouter.get("/", getEvents);
eventsRouter.post("/", validate({ body: createEventSchema }), postEvent);
eventsRouter.patch("/mute-day/:dayOfWeek", validate({ params: dayOfWeekParamsSchema }), muteDayEvents);
eventsRouter.patch("/unmute-day/:dayOfWeek", validate({ params: dayOfWeekParamsSchema }), unmuteDayEvents);
eventsRouter.delete("/day/:dayOfWeek", validate({ params: dayOfWeekParamsSchema }), clearDayEvents);
eventsRouter.patch("/:id", validate({ params: idParamsSchema, body: updateEventSchema }), patchEvent);
eventsRouter.delete("/:id", validate({ params: idParamsSchema }), deleteEventById);
