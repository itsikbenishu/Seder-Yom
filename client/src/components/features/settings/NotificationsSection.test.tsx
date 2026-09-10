import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NotificationsSection } from "./NotificationsSection";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../../ui", () => ({ SegmentedControl: () => null }));

const { isMobileUserAgent } = vi.hoisted(() => ({ isMobileUserAgent: vi.fn() }));
vi.mock("../../../utils/userAgent", () => ({ isMobileUserAgent }));

const noop = () => undefined;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NotificationsSection — hint selection", () => {
  it("shows the blocked hint when permission is denied", () => {
    isMobileUserAgent.mockReturnValue(false);
    render(<NotificationsSection channel="browser" onChange={noop} permission="denied" />);
    expect(screen.getByText("settings.notifications.blocked")).toBeInTheDocument();
  });

  it("shows the unsupported hint", () => {
    isMobileUserAgent.mockReturnValue(false);
    render(<NotificationsSection channel="browser" onChange={noop} permission="unsupported" />);
    expect(screen.getByText("settings.notifications.unsupported")).toBeInTheDocument();
  });

  it("shows the default note when the channel matches the current device", () => {
    isMobileUserAgent.mockReturnValue(false);
    render(<NotificationsSection channel="browser" onChange={noop} permission="default" />);
    expect(screen.getByText("settings.notifications.note")).toBeInTheDocument();
  });

  it("shows the device-mismatch hint for 'mobile' chosen on a desktop", () => {
    isMobileUserAgent.mockReturnValue(false);
    render(<NotificationsSection channel="mobile" onChange={noop} permission="default" />);
    expect(screen.getByText("settings.notifications.deviceMismatch")).toBeInTheDocument();
  });

  it("shows the device-mismatch hint for 'browser' chosen on a mobile", () => {
    isMobileUserAgent.mockReturnValue(true);
    render(<NotificationsSection channel="browser" onChange={noop} permission="granted" />);
    expect(screen.getByText("settings.notifications.deviceMismatch")).toBeInTheDocument();
  });
});
