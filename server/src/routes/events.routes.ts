import { Router } from "express";
import { z } from "zod";
import { createEventSchema, updateEventSchema } from "@project/shared";
import { deleteEventById, getEvents, patchEvent, postEvent } from "../controllers/events.controller.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

const idParamsSchema = z.object({ id: z.uuid() });

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

eventsRouter.get("/", getEvents);
eventsRouter.post("/", validate({ body: createEventSchema }), postEvent);
eventsRouter.patch("/:id", validate({ params: idParamsSchema, body: updateEventSchema }), patchEvent);
eventsRouter.delete("/:id", validate({ params: idParamsSchema }), deleteEventById);
