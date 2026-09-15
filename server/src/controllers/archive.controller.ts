import type { Request, Response } from "express";
import type { ArchiveDayQuery, ArchiveQuery } from "@project/shared";
import { archiveDay, deleteArchivedDay as deleteArchivedDayService, listArchivedDays } from "../services/archive.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getArchive(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ArchiveQuery;
  const result = await listArchivedDays(req.userId, query);
  sendSuccess(res, result);
}

export async function postArchiveDay(req: Request, res: Response): Promise<void> {
  const { onConflict } = req.query as unknown as ArchiveDayQuery;
  const result = await archiveDay(req.userId, Number(req.params.dayOfWeek), onConflict);
  sendSuccess(res, result, 201);
}

export async function deleteArchivedDay(req: Request<{ id: string }>, res: Response): Promise<void> {
  await deleteArchivedDayService(req.userId, req.params.id);
  sendSuccess(res, null);
}
