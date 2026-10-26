import { describe, expect, it } from "vitest";
import {
  DATA_DELETION_DATE,
  SERVICE_END_DATE,
  daysUntilServiceEnd,
  formatKoreanDate,
  getRetirementPhase,
  isNewAccountAfterBlock,
  isSignupBlocked,
  kstStartOf,
} from "../lib/retirement";

describe("retirement schedule", () => {
  it("formats the announced dates with Korean weekdays", () => {
    expect(formatKoreanDate(SERVICE_END_DATE)).toBe("2027년 2월 26일(금)");
    expect(formatKoreanDate(DATA_DELETION_DATE)).toBe("2027년 3월 5일(금)");
    expect(formatKoreanDate("2026-11-02", false)).toBe("11월 2일(월)");
  });

  it("treats dates as Korean midnight", () => {
    expect(kstStartOf("2026-11-02").toISOString()).toBe("2026-11-01T15:00:00.000Z");
  });

  it("blocks sign-ups from 2026-11-02 00:00 KST", () => {
    expect(isSignupBlocked(new Date("2026-11-01T14:59:59Z"))).toBe(false);
    expect(isSignupBlocked(new Date("2026-11-01T15:00:00Z"))).toBe(true);
  });

  it("only flags accounts created on/after the block date", () => {
    const now = new Date("2026-11-20T00:00:00Z");
    // Firebase metadata.creationTime 형식(UTC 문자열)
    expect(isNewAccountAfterBlock("Sun, 01 Nov 2026 14:59:59 GMT", now)).toBe(false);
    expect(isNewAccountAfterBlock("Sun, 01 Nov 2026 15:00:00 GMT", now)).toBe(true);
    expect(isNewAccountAfterBlock("Mon, 02 Mar 2026 00:00:00 GMT", now)).toBe(false);
    // 알 수 없으면 기존 사용자 보호
    expect(isNewAccountAfterBlock(undefined, now)).toBe(false);
    expect(isNewAccountAfterBlock("not a date", now)).toBe(false);
    // 차단 시작 전에는 아무도 막지 않아요
    expect(
      isNewAccountAfterBlock("Sun, 01 Nov 2026 15:00:00 GMT", new Date("2026-10-30T00:00:00Z"))
    ).toBe(false);
  });

  it("switches phases at the reminder date and after the last day", () => {
    expect(getRetirementPhase(new Date("2026-11-02T00:00:00Z"))).toBe("notice");
    expect(getRetirementPhase(new Date("2026-12-20T15:00:00Z"))).toBe("reminder");
    expect(getRetirementPhase(new Date("2027-02-26T14:59:59Z"))).toBe("reminder");
    expect(getRetirementPhase(new Date("2027-02-26T15:00:00Z"))).toBe("ended");
  });

  it("counts days left in Korean time", () => {
    expect(daysUntilServiceEnd(new Date("2027-02-25T15:00:00Z"))).toBe(0); // 2/26 00:00 KST
    expect(daysUntilServiceEnd(new Date("2027-02-25T14:59:59Z"))).toBe(1);
    expect(daysUntilServiceEnd(new Date("2026-12-20T15:00:00Z"))).toBe(67);
  });
});
