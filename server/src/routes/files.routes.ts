import { Router } from "express";
import multer from "multer";
import { MAX_FILE_SIZE_BYTES } from "@project/shared";
import { postFileUpload } from "../controllers/files.controller.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });

export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.post("/upload", upload.single("file"), postFileUpload);
