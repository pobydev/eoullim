"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function Home() {
  const { user, loading, signInWithGoogle, signInWithNaver, signInWithKakao } = useAuth();
  const router = useRouter();
  const isFirebaseConfigured = !!auth;

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-200 via-sky-50 to-blue-200" data-page="login">
      <Card className="w-full max-w-md mx-auto shadow-xl rounded-3xl bg-white/90 backdrop-blur-sm border border-sky-100/50">
        <CardContent className="p-8">
          <div className="text-center space-y-2">
            <div className="space-y-1">
              <div className="flex justify-center">
                <img
                  src="/logo.png"
                  alt="어울림"
                  className="h-48 w-auto object-contain"
                />
              </div>
              <p 
                className="text-3xl text-gray-700 font-medium leading-relaxed flex flex-col"
                style={{ fontFamily: '"학교안심 받아쓰기체", sans-serif' }}
              >
                <span>"자리에서 시작되는</span>
                <span>우리 반의 새로운 이야기"</span>
              </p>
            </div>

            {!isFirebaseConfigured && (
              <div className="p-4 bg-muted border border-border rounded-lg max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-2">
                  Firebase 설정이 필요합니다.
                </p>
                <Link
                  href="/firebase-setup"
                  className="text-sm text-primary hover:underline"
                >
                  설정 방법 보기 →
                </Link>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button
                onClick={signInWithGoogle}
                size="lg"
                disabled={!isFirebaseConfigured}
                className="w-full"
              >
                Google로 시작하기
              </Button>
              
              <Button
                onClick={signInWithNaver}
                size="lg"
                disabled={!isFirebaseConfigured}
                className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white"
              >
                네이버로 시작하기
              </Button>
              
              <Button
                onClick={signInWithKakao}
                size="lg"
                disabled={!isFirebaseConfigured}
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black"
              >
                카카오로 시작하기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
