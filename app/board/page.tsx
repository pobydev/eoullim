"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NoticeList from "@/components/board/NoticeList";
import FeedbackList from "@/components/board/FeedbackList";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { isAdmin } from "@/lib/firestore";

export default function BoardPage() {
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
        <h1 className="text-3xl font-bold">게시판</h1>
        <div className="flex gap-2">
          {isUserAdmin && (
            <Link href="/board/notices/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                공지사항 작성
              </Button>
            </Link>
          )}
          <Link href="/board/feedbacks/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Q&A 작성
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="notices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notices" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            공지사항
          </TabsTrigger>
          <TabsTrigger value="feedbacks" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Q&A
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notices">
          <NoticeList />
        </TabsContent>
        <TabsContent value="feedbacks">
          <FeedbackList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

