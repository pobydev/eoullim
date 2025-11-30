"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { Monitor, Smartphone, Users, Layout, Printer, Sparkles } from "lucide-react";

export default function Home() {
  const { user, loading, signInWithGoogle, signInWithNaver, signInWithKakao } = useAuth();
  const router = useRouter();
  const isFirebaseConfigured = !!auth;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }

    // 모바일 감지
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-3xl bg-white/90 backdrop-blur-sm border border-sky-100/50">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
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

            {isMobile ? (
              // 모바일 접속 시 안내 메시지
              <div className="space-y-4">
                <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Smartphone className="h-6 w-6 text-amber-600" />
                    <h3 className="text-lg font-semibold text-amber-900">데스크탑 또는 태블릿 사용 권장</h3>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    어울림은 교실 자리 배치를 위한 도구로,<br />
                    더 나은 사용 경험을 위해 <strong>데스크탑 또는 태블릿</strong>에서 사용하시는 것을 권장합니다.
                  </p>
                </div>
              </div>
            ) : (
              // 데스크탑 접속 시 로그인 버튼
              <>
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
              </>
            )}

            {/* 사이트 소개 및 기능 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">어울림이란?</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                교실 자리 배치를 쉽고 빠르게 할 수 있도록 도와주는 웹 도구입니다.<br />
                복잡한 자리 배치 작업을 간단하게 만들어드립니다.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex gap-3 p-4 bg-sky-50 rounded-lg">
                  <Users className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">학급 명단 관리</h4>
                    <p className="text-sm text-gray-600">엑셀에서 복사한 학생 정보를 붙여넣어 쉽게 관리할 수 있습니다.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-sky-50 rounded-lg">
                  <Layout className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">자동 배치</h4>
                    <p className="text-sm text-gray-600">클릭 한 번으로 최적의 자리 배치를 자동으로 생성합니다.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-sky-50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">배치 효과</h4>
                    <p className="text-sm text-gray-600">카운트다운, 순차 배치, 파도 배치 등 다양한 효과로 배치를 공개합니다.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-sky-50 rounded-lg">
                  <Printer className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">저장 및 인쇄</h4>
                    <p className="text-sm text-gray-600">배치 결과를 저장하고 인쇄하여 교실에 바로 사용할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
