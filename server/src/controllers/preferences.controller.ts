import type { Request, Response } from "express";
import type { UpdateUserPreferencesInput } from "@project/shared";
import { getUserPreferences, upsertUserPreferences } from "../services/userPreferences.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getPreferences(req: Request, res: Response): Promise<void> {
  const preferences = await getUserPreferences(req.userId);
  sendSuccess(res, preferences);
}

export async function postPreferences(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateUserPreferencesInput;
  const preferences = await upsertUserPreferences(req.userId, input);
  sendSuccess(res, preferences);
}
