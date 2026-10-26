import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import {
  SIGNUP_CLOSED_CODE,
  SIGNUP_CLOSED_MESSAGE,
  isBlockedNewSignup,
} from "@/lib/signup-guard";

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "네이버 OAuth 설정이 필요합니다." },
        { status: 500 }
      );
    }

    // 네이버 액세스 토큰 받기
    const tokenResponse = await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`,
      { method: "POST" }
    );

    if (!tokenResponse.ok) {
      throw new Error("네이버 토큰 요청 실패");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("액세스 토큰을 받지 못했습니다.");
    }

    // 사용자 정보 가져오기
    const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      throw new Error("사용자 정보 요청 실패");
    }

    const userData = await userResponse.json();
    const naverUser = userData.response;

    if (!naverUser) {
      throw new Error("사용자 정보를 받지 못했습니다.");
    }

    // Firebase UID 생성 (네이버 ID 기반)
    const uid = `naver_${naverUser.id}`;
    const email = naverUser.email || `${uid}@naver.local`;

    // Firebase Admin이 초기화되지 않았으면 에러
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: "Firebase Admin이 초기화되지 않았습니다." },
        { status: 500 }
      );
    }

    // 새 가입 차단: Firebase에 아직 없는 계정이면 토큰을 만들지 않아요(기존 사용자는 그대로).
    if (await isBlockedNewSignup(uid)) {
      return NextResponse.json(
        { error: SIGNUP_CLOSED_MESSAGE, code: SIGNUP_CLOSED_CODE },
        { status: 403 }
      );
    }

    // Custom Token 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      email,
      displayName: naverUser.name,
      photoURL: naverUser.profile_image,
      provider: "naver",
    });

    // 사용자 정보 업데이트 (이메일 포함)
    try {
      await admin.auth().updateUser(uid, {
        email: email,
        emailVerified: false, // 네이버 이메일은 인증되지 않음
        displayName: naverUser.name,
        photoURL: naverUser.profile_image || undefined,
      });
    } catch (error) {
      console.error("사용자 정보 업데이트 실패:", error);
      // 업데이트 실패해도 토큰은 반환 (이미 생성됨)
    }

    return NextResponse.json({ customToken });
  } catch (error: unknown) {
    console.error("네이버 로그인 처리 실패:", error);
    const message =
      error instanceof Error
        ? error.message
        : "네이버 로그인 처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
