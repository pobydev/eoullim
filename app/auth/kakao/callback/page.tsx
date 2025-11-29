"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setError("카카오 로그인이 취소되었습니다.");
        setTimeout(() => router.push("/"), 2000);
        return;
      }

      if (!code) {
        setError("인증 코드를 받지 못했습니다.");
        setTimeout(() => router.push("/"), 2000);
        return;
      }

      try {
        // 서버에서 토큰 교환 및 사용자 정보 가져오기
        const response = await fetch("/api/auth/kakao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "로그인 처리 실패");
        }

        if (data.customToken && auth) {
          // Firebase Custom Token으로 로그인
          await signInWithCustomToken(auth, data.customToken);
          router.push("/dashboard");
        } else {
          throw new Error("토큰을 받지 못했습니다.");
        }
      } catch (error: any) {
        console.error("카카오 로그인 처리 실패:", error);
        setError(error.message || "로그인에 실패했습니다.");
        setTimeout(() => router.push("/"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-200 via-sky-50 to-blue-200">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-lg text-red-600">{error}</div>
            <div className="text-sm text-gray-600">잠시 후 메인 페이지로 이동합니다...</div>
          </>
        ) : (
          <>
            <div className="text-lg text-gray-700">카카오 로그인 처리 중...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
}

