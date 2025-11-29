"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 이미지 프리로드 (link 태그로)
  useEffect(() => {
    const images = [
      '/classroom-background.png',
      '/desk-wood.png',
      '/desk-wood-boy.png',
      '/desk-wood-girl.png',
    ];

    images.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'image';
      document.head.appendChild(link);
    });

    // 컴포넌트 언마운트 시 정리 (선택사항)
    return () => {
      images.forEach((href) => {
        const link = document.querySelector(`link[href="${href}"]`);
        if (link) {
          document.head.removeChild(link);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <DashboardContent />;
}







