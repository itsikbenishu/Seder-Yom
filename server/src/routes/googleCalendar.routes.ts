import { Router } from "express";
import { googleCalendarCallbackQuerySchema, googleCalendarEventsQuerySchema } from "@project/shared";
import { getCallback, getConnect, getEvents, getStatus, postDisconnect } from "../controllers/googleCalendar.controller.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

export const googleCalendarRouter = Router();

googleCalendarRouter.use(requireAuth);
googleCalendarRouter.use(rateLimitMiddleware);

googleCalendarRouter.get("/connect", getConnect);
googleCalendarRouter.get("/callback", validate({ query: googleCalendarCallbackQuerySchema }), getCallback);
googleCalendarRouter.get("/status", getStatus);
googleCalendarRouter.get("/events", validate({ query: googleCalendarEventsQuerySchema }), getEvents);
googleCalendarRouter.post("/disconnect", postDisconnect);
