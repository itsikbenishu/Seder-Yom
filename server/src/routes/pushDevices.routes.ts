import { Router } from "express";
import { registerPushDeviceSchema, unregisterPushDeviceSchema } from "@project/shared";
import { deleteDevice, postDevice } from "../controllers/pushDevices.controller.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { validate } from "./middlewares/validate.middleware.js";

export const pushDevicesRouter = Router();

pushDevicesRouter.use(requireAuth);
pushDevicesRouter.use(rateLimitMiddleware);

pushDevicesRouter.post("/", validate({ body: registerPushDeviceSchema }), postDevice);
pushDevicesRouter.delete("/", validate({ body: unregisterPushDeviceSchema }), deleteDevice);
