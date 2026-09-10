import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import request from "supertest";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const { upsertPushDevice, deletePushDevice } = vi.hoisted(() => ({
  upsertPushDevice: vi.fn().mockResolvedValue(undefined),
  deletePushDevice: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/pushDevices.service.js", () => ({ upsertPushDevice, deletePushDevice }));
vi.mock("./middlewares/requireAuth.middleware.js", () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    req.userId = USER_ID;
    next();
  },
}));
vi.mock("../config/logger.js", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const { pushDevicesRouter } = await import("./pushDevices.routes.js");
const { errorHandlerMiddleware } = await import("./middlewares/errorHandler.middleware.js");

const app = express();
app.use(express.json());
app.use("/api/v1/devices", pushDevicesRouter);
app.use(errorHandlerMiddleware);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("POST /api/v1/devices", () => {
  it("registers a token and returns the success envelope", async () => {
    const res = await request(app)
      .post("/api/v1/devices")
      .set("user-agent", "jsdom")
      .send({ token: "fcm-abc", platform: "browser" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });
    expect(upsertPushDevice).toHaveBeenCalledWith(USER_ID, {
      token: "fcm-abc",
      platform: "browser",
      userAgent: "jsdom",
    });
  });

  it("rejects a missing token with the error envelope", async () => {
    const res = await request(app).post("/api/v1/devices").send({ platform: "browser" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(typeof res.body.error.message).toBe("string");
    expect(upsertPushDevice).not.toHaveBeenCalled();
  });

  it("rejects an unknown platform", async () => {
    const res = await request(app).post("/api/v1/devices").send({ token: "fcm-abc", platform: "watch" });
    expect(res.status).toBe(400);
    expect(upsertPushDevice).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/devices", () => {
  it("removes a token scoped to the caller", async () => {
    const res = await request(app).delete("/api/v1/devices").send({ token: "fcm-abc" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });
    expect(deletePushDevice).toHaveBeenCalledWith(USER_ID, "fcm-abc");
  });

  it("rejects a body with no token", async () => {
    const res = await request(app).delete("/api/v1/devices").send({});
    expect(res.status).toBe(400);
    expect(deletePushDevice).not.toHaveBeenCalled();
  });
});
