// 서버 전용: 카카오·네이버 로그인 API에서 새 가입을 막을 때 써요.
import admin from "@/lib/firebase-admin";
import {
  SIGNUP_BLOCK_DATE,
  SIGNUP_CLOSED_CODE,
  formatKoreanDate,
  isSignupBlocked,
} from "@/lib/retirement";

export { SIGNUP_CLOSED_CODE };
export const SIGNUP_CLOSED_MESSAGE = `${formatKoreanDate(
  SIGNUP_BLOCK_DATE
)}부터 새로운 가입은 받지 않아요. PC판을 내려받아 이용해 주세요.`;

/**
 * 가입 차단 기간이고 Firebase Auth에 아직 없는 계정(uid)이면 true.
 * 커스텀 토큰으로 처음 로그인할 때 계정이 만들어지므로, 여기서 막으면 계정이 생기지 않아요.
 * 확인 중 다른 오류가 나면 기존 사용자를 막지 않도록 false를 돌려줘요(클라이언트에서 한 번 더 확인해요).
 */
export async function isBlockedNewSignup(uid: string): Promise<boolean> {
  if (!isSignupBlocked()) return false;
  try {
    await admin.auth().getUser(uid);
    return false;
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    return code === "auth/user-not-found";
  }
}
