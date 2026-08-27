import { Router } from "express";
import { loginRequestSchema, verifyRequestSchema } from "@project/shared";
import { postLogin, postLogout, postVerify } from "../controllers/auth.controller.js";
import { validate } from "./middlewares/validate.middleware.js";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginRequestSchema }), postLogin);
authRouter.post("/verify", validate({ body: verifyRequestSchema }), postVerify);
authRouter.post("/logout", postLogout);
