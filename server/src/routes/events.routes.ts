import { Router } from "express";
import { z } from "zod";
import { createEventSchema, updateEventSchema } from "@project/shared";
import { deleteEventById, getEvents, muteDayEvents, patchEvent, postEvent } from "../controllers/events.controller.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

const idParamsSchema = z.object({ id: z.uuid() });
const muteDayParamsSchema = z.object({ dayOfWeek: z.coerce.number().int().min(0).max(6) });

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

eventsRouter.get("/", getEvents);
eventsRouter.post("/", validate({ body: createEventSchema }), postEvent);
eventsRouter.patch("/mute-day/:dayOfWeek", validate({ params: muteDayParamsSchema }), muteDayEvents);
eventsRouter.patch("/:id", validate({ params: idParamsSchema, body: updateEventSchema }), patchEvent);
eventsRouter.delete("/:id", validate({ params: idParamsSchema }), deleteEventById);
