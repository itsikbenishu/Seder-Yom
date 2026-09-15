import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../../utils/AppError.js";

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0]?.message ?? "validation.invalid");
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0]?.message ?? "validation.invalid");
      }
      req.params = result.data as typeof req.params;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0]?.message ?? "validation.invalid");
      }
      // req.query is a getter-only accessor in Express 5 (no setter), so a plain
      // assignment throws under ESM's strict mode - redefine the property instead.
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true, enumerable: true });
    }

    next();
  };
}
