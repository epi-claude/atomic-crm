import { describe, it, expect } from "vitest";
import { enrollmentStatus } from "./CampaignEnrollmentsPanel";
import type { DripEnrollment } from "../types";

const base: DripEnrollment = {
  id: 1,
  contact_id: 10,
  campaign_id: 1,
  step: 1,
  enrolled_at: "2026-04-01T00:00:00Z",
  last_sent_at: null,
  completed_at: null,
  suppressed: false,
  suppressed_reason: null,
};

describe("enrollmentStatus", () => {
  it("returns suppressed_reason when suppressed and reason is set", () => {
    const e: DripEnrollment = { ...base, suppressed: true, suppressed_reason: "bounce" };
    expect(enrollmentStatus(e, 3)).toBe("bounce");
  });

  it("returns 'suppressed' when suppressed but no reason", () => {
    const e: DripEnrollment = { ...base, suppressed: true, suppressed_reason: null };
    expect(enrollmentStatus(e, 3)).toBe("suppressed");
  });

  it("returns 'completed' when completed_at is set", () => {
    const e: DripEnrollment = { ...base, completed_at: "2026-04-10T08:00:00Z" };
    expect(enrollmentStatus(e, 3)).toBe("completed");
  });

  it("returns step/total when active", () => {
    const e: DripEnrollment = { ...base, step: 2 };
    expect(enrollmentStatus(e, 3)).toBe("step 2 / 3");
  });

  it("returns step 1 / 1 for a single-step campaign", () => {
    const e: DripEnrollment = { ...base, step: 1 };
    expect(enrollmentStatus(e, 1)).toBe("step 1 / 1");
  });

  it("suppressed takes priority over completed_at", () => {
    const e: DripEnrollment = {
      ...base,
      suppressed: true,
      suppressed_reason: "complaint",
      completed_at: "2026-04-10T08:00:00Z",
    };
    expect(enrollmentStatus(e, 3)).toBe("complaint");
  });
});
