"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 이미지 프리로드 - 페이지 로드 시 즉시 시작
  useEffect(() => {
    const images = [
      "/classroom-background.png",
      "/desk-wood.png",
      "/desk-wood-boy.png",
      "/desk-wood-girl.png",
    ];

    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
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







