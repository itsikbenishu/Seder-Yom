import { afterEach, describe, expect, it, vi } from "vitest";
import { isMobileUserAgent } from "./userAgent";

function withUserAgent(value: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(value);
}

afterEach(() => vi.restoreAllMocks());

describe("isMobileUserAgent", () => {
  it("is true for common mobile user agents", () => {
    withUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15");
    expect(isMobileUserAgent()).toBe(true);

    withUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36");
    expect(isMobileUserAgent()).toBe(true);
  });

  it("is false for desktop user agents", () => {
    withUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36");
    expect(isMobileUserAgent()).toBe(false);

    withUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15");
    expect(isMobileUserAgent()).toBe(false);
  });
});
