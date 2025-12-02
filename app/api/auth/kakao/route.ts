import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const redirectUri = `${baseUrl}/auth/kakao/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "카카오 OAuth 설정이 필요합니다." },
        { status: 500 }
      );
    }

    // 카카오 액세스 토큰 받기
    const tokenResponse = await fetch(`https://kauth.kakao.com/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || "카카오 토큰 요청 실패");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("액세스 토큰을 받지 못했습니다.");
    }

    // 사용자 정보 가져오기
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("카카오 사용자 정보 요청 실패:", errorText);
      throw new Error("사용자 정보 요청 실패");
    }

    const userData = await userResponse.json();
    console.log("카카오 사용자 정보 응답:", JSON.stringify(userData, null, 2));

    // 카카오 사용자 ID 확인
    if (!userData.id) {
      console.error("카카오 사용자 ID가 없습니다:", userData);
      throw new Error("카카오 사용자 ID를 받지 못했습니다.");
    }

    const kakaoUser = userData.kakao_account;
    const kakaoProfile = userData.properties || kakaoUser?.profile;

    // Firebase UID 생성
    const uid = `kakao_${userData.id}`;
    const email = kakaoUser?.email || `${uid}@kakao.local`;
    const displayName =
      kakaoUser?.profile?.nickname ||
      kakaoProfile?.nickname ||
      kakaoProfile?.nick_name ||
      "카카오 사용자";
    const photoURL =
      kakaoUser?.profile?.profile_image_url ||
      kakaoProfile?.profile_image ||
      kakaoProfile?.thumbnail_image;

    // Firebase Admin이 초기화되지 않았으면 에러
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: "Firebase Admin이 초기화되지 않았습니다." },
        { status: 500 }
      );
    }

    // Custom Token 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      email,
      displayName: displayName,
      photoURL: photoURL,
      provider: "kakao",
    });

    // 사용자 정보 업데이트 (이메일 포함)
    try {
      await admin.auth().updateUser(uid, {
        email: email,
        emailVerified: false, // 카카오 이메일은 인증되지 않음
        displayName: displayName || undefined,
        photoURL: photoURL || undefined,
      });
    } catch (error) {
      console.error("사용자 정보 업데이트 실패:", error);
      // 업데이트 실패해도 토큰은 반환 (이미 생성됨)
    }

    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error("카카오 로그인 처리 실패:", error);
    return NextResponse.json(
      { error: error.message || "카카오 로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
