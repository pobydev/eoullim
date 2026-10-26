// 웹 서비스 종료(PC판 전환) 일정.
// 날짜를 바꿀 때는 이 파일의 상수만 고치면 돼요. 모든 날짜는 한국 시간(KST) 기준이에요.

/** 안내 시작일(배포일). 안내 배너는 배포되는 순간부터 보여요. */
export const NOTICE_START_DATE = "2026-11-02";
/** 이 날 0시(KST)부터 새로 만들어진 계정은 가입이 막혀요. */
export const SIGNUP_BLOCK_DATE = "2026-11-02";
/** 두 번째 안내일. 이 날부터 배너에 남은 날짜가 함께 보여요. */
export const SECOND_REMINDER_DATE = "2026-12-21";
/** 서비스 마지막 날. 이 날 하루가 끝날 때까지 쓸 수 있어요. */
export const SERVICE_END_DATE = "2027-02-26";
/** 웹에 저장된 데이터를 지우는 날. */
export const DATA_DELETION_DATE = "2027-03-05";

/** PC판 내려받기 주소(임시). 실제 배포 주소가 정해지면 여기만 바꿔 주세요. */
export const PC_DOWNLOAD_URL =
  "https://github.com/pobydev/eoullim-pc/releases/latest";

/** 카카오·네이버 로그인 API가 새 가입을 거절할 때 돌려주는 코드 */
export const SIGNUP_CLOSED_CODE = "signup-closed";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parseDateOnly(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m, d];
}

/** "YYYY-MM-DD"의 한국 시간 0시를 Date로 돌려줘요. */
export function kstStartOf(date: string): Date {
  const [y, m, d] = parseDateOnly(date);
  return new Date(Date.UTC(y, m - 1, d) - KST_OFFSET_MS);
}

/** "2027-02-26" → "2027년 2월 26일(금)" */
export function formatKoreanDate(date: string, withYear = true): string {
  const [y, m, d] = parseDateOnly(date);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${withYear ? `${y}년 ` : ""}${m}월 ${d}일(${weekday})`;
}

export type RetirementPhase = "notice" | "reminder" | "ended";

export function getRetirementPhase(now: Date = new Date()): RetirementPhase {
  const t = now.getTime();
  if (t >= kstStartOf(SERVICE_END_DATE).getTime() + DAY_MS) return "ended";
  if (t >= kstStartOf(SECOND_REMINDER_DATE).getTime()) return "reminder";
  return "notice";
}

/** 오늘(KST)부터 서비스 마지막 날까지 남은 날 수. 마지막 날 당일은 0이에요. */
export function daysUntilServiceEnd(now: Date = new Date()): number {
  const kstToday = Math.floor((now.getTime() + KST_OFFSET_MS) / DAY_MS);
  const [y, m, d] = parseDateOnly(SERVICE_END_DATE);
  const endDay = Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
  return endDay - kstToday;
}

export function isSignupBlocked(now: Date = new Date()): boolean {
  return now.getTime() >= kstStartOf(SIGNUP_BLOCK_DATE).getTime();
}

/**
 * 가입 차단 대상인지 판단해요: 차단 기간이고, 계정이 차단일 이후에 만들어졌을 때.
 * 만든 시각을 알 수 없으면 기존 사용자를 보호하려고 차단하지 않아요.
 * (데이터가 이미 있는지는 호출하는 쪽에서 따로 확인해요.)
 */
export function isNewAccountAfterBlock(
  creationTime: string | undefined | null,
  now: Date = new Date()
): boolean {
  if (!isSignupBlocked(now) || !creationTime) return false;
  const created = Date.parse(creationTime);
  if (Number.isNaN(created)) return false;
  return created >= kstStartOf(SIGNUP_BLOCK_DATE).getTime();
}
