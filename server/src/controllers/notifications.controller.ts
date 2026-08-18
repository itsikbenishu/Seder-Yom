import type { Request, Response } from "express";
import type { UpdateNotificationPreferencesInput } from "@project/shared";
import { getNotificationPreferences, upsertNotificationPreferences } from "../services/notificationPreferences.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getPreferences(req: Request, res: Response): Promise<void> {
  const preferences = await getNotificationPreferences(req.userId);
  sendSuccess(res, preferences);
}

export async function postPreferences(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateNotificationPreferencesInput;
  const preferences = await upsertNotificationPreferences(req.userId, input);
  sendSuccess(res, preferences);
}
