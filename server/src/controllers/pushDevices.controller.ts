import type { Request, Response } from "express";
import type { RegisterPushDeviceInput, UnregisterPushDeviceInput } from "@project/shared";
import { deletePushDevice, upsertPushDevice } from "../services/pushDevices.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function postDevice(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterPushDeviceInput;
  await upsertPushDevice(req.userId, { ...input, userAgent: req.get("user-agent") });
  sendSuccess(res, null);
}

export async function deleteDevice(req: Request, res: Response): Promise<void> {
  const { token } = req.body as UnregisterPushDeviceInput;
  await deletePushDevice(req.userId, token);
  sendSuccess(res, null);
}
