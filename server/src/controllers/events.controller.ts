import type { Request, Response } from "express";
import type { CreateEventInput, UpdateEventInput } from "@project/shared";
import {
  clearDayEvents as clearDayEventsService,
  createEvent,
  deleteEvent,
  listEvents,
  muteDayEvents as muteDayEventsService,
  unmuteDayEvents as unmuteDayEventsService,
  updateEvent,
} from "../services/events.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getEvents(req: Request, res: Response): Promise<void> {
  const result = await listEvents(req.userId);
  sendSuccess(res, result);
}

export async function postEvent(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateEventInput;
  const result = await createEvent(req.userId, input, req.correlationId);
  sendSuccess(res, result, 201);
}

export async function patchEvent(req: Request<{ id: string }>, res: Response): Promise<void> {
  const patch = req.body as UpdateEventInput;
  const result = await updateEvent(req.userId, req.params.id, patch);
  sendSuccess(res, result);
}

export async function deleteEventById(req: Request<{ id: string }>, res: Response): Promise<void> {
  await deleteEvent(req.userId, req.params.id);
  sendSuccess(res, null);
}

export async function muteDayEvents(req: Request<{ dayOfWeek: string }>, res: Response): Promise<void> {
  await muteDayEventsService(req.userId, Number(req.params.dayOfWeek));
  sendSuccess(res, null);
}

export async function clearDayEvents(req: Request<{ dayOfWeek: string }>, res: Response): Promise<void> {
  await clearDayEventsService(req.userId, Number(req.params.dayOfWeek));
  sendSuccess(res, null);
}

export async function unmuteDayEvents(req: Request<{ dayOfWeek: string }>, res: Response): Promise<void> {
  await unmuteDayEventsService(req.userId, Number(req.params.dayOfWeek));
  sendSuccess(res, null);
}
