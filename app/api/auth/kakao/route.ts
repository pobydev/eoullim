import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const redirectUri = `${baseUrl}/auth/kakao/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "카카오 OAuth 설정이 필요합니다." },
        { status: 500 }
      );
    }

    // 카카오 액세스 토큰 받기
    const tokenResponse = await fetch(
      `https://kauth.kakao.com/oauth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      }
    );
    
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
      throw new Error("사용자 정보 요청 실패");
    }
    
    const userData = await userResponse.json();
    const kakaoUser = userData.kakao_account;
    
    if (!kakaoUser) {
      throw new Error("사용자 정보를 받지 못했습니다.");
    }
    
    // Firebase UID 생성
    const uid = `kakao_${userData.id}`;
    const email = kakaoUser.email || `${uid}@kakao.local`;
    
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
      displayName: kakaoUser.profile?.nickname,
      photoURL: kakaoUser.profile?.profile_image_url,
      provider: "kakao",
    });
    
    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error("카카오 로그인 처리 실패:", error);
    return NextResponse.json(
      { error: error.message || "카카오 로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

