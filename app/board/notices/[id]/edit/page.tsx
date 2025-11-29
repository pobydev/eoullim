"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Notice } from "@/types";
import { getNotice } from "@/lib/firestore";
import NoticeForm from "@/components/board/NoticeForm";
import { Loader2 } from "lucide-react";

export default function EditNoticePage() {
  const params = useParams();
  const noticeId = params.id as string;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (noticeId) {
      loadNotice();
    }
  }, [noticeId]);

  const loadNotice = async () => {
    try {
      setLoading(true);
      const data = await getNotice(noticeId);
      setNotice(data);
    } catch (error) {
      console.error("공지사항 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-center text-gray-500">공지사항을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return <NoticeForm notice={notice} />;
}

