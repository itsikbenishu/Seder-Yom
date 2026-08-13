import type { Request, Response } from "express";
import type { ArchiveQuery } from "@project/shared";
import { archiveDay, listArchivedDays } from "../services/archive.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getArchive(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ArchiveQuery;
  const result = await listArchivedDays(req.userId, query);
  sendSuccess(res, result);
}

export async function postArchiveDay(req: Request, res: Response): Promise<void> {
  const result = await archiveDay(req.userId, Number(req.params.dayOfWeek));
  sendSuccess(res, result, 201);
}
