"use client";

import NoticeList from "@/components/board/NoticeList";
import { Button } from "@/components/ui/button";
import { Plus, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { isAdmin } from "@/lib/firestore";

export default function NoticesPage() {
  const { user } = useAuth();
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdmin();
    }
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    try {
      const admin = await isAdmin(user.uid, user.email || undefined);
      setIsUserAdmin(admin);
    } catch (error) {
      console.error("관리자 체크 실패:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/board">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                게시판으로
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              공지사항
            </h1>
          </div>
          {isUserAdmin && (
            <Link href="/board/notices/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                작성
              </Button>
            </Link>
          )}
        </div>

      <NoticeList />
    </div>
  );
}

