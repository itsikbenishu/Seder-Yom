import { Router } from "express";
import { updateNotificationPreferencesSchema } from "@project/shared";
import { getPreferences, postPreferences } from "../controllers/notifications.controller.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/preferences", getPreferences);
notificationsRouter.post("/preferences", validate({ body: updateNotificationPreferencesSchema }), postPreferences);
