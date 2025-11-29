import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();
    
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const redirectUri = `${baseUrl}/auth/naver/callback`;

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
    
    // Custom Token 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      email,
      displayName: naverUser.name,
      photoURL: naverUser.profile_image,
      provider: "naver",
    });
    
    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error("네이버 로그인 처리 실패:", error);
    return NextResponse.json(
      { error: error.message || "네이버 로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

