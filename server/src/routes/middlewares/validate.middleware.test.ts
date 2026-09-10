import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validate } from "./validate.middleware.js";

const bodySchema = z.object({ token: z.string().min(1, "validation.token.required") });

function run(schemas: Parameters<typeof validate>[0], req: Partial<Request>) {
  const next = vi.fn() as unknown as NextFunction;
  const invoke = () => validate(schemas)(req as Request, {} as Response, next);
  return { next, invoke };
}

describe("validate middleware", () => {
  it("replaces req.body with the parsed value and calls next", () => {
    const req = { body: { token: "abc", extra: "dropped" } };
    const { next, invoke } = run({ body: bodySchema }, req);
    invoke();
    expect(req.body).toEqual({ token: "abc" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws a 400 ValidationError carrying the schema's message", () => {
    const { next, invoke } = run({ body: bodySchema }, { body: { token: "" } });
    expect(invoke).toThrowError(
      expect.objectContaining({ statusCode: 400, code: "VALIDATION_ERROR", message: "validation.token.required" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("validates and coerces params too", () => {
    const paramsSchema = z.object({ id: z.coerce.number() });
    const req = { params: { id: "42" } as unknown as Request["params"] };
    const { invoke } = run({ params: paramsSchema }, req);
    invoke();
    expect(req.params).toEqual({ id: 42 });
  });
});
