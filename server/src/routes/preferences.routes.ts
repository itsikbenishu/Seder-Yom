import { Router } from "express";
import { updateUserPreferencesSchema } from "@project/shared";
import { getPreferences, postPreferences } from "../controllers/preferences.controller.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

export const preferencesRouter = Router();

preferencesRouter.use(requireAuth);

preferencesRouter.get("/", getPreferences);
preferencesRouter.post("/", validate({ body: updateUserPreferencesSchema }), postPreferences);
