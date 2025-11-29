"use client";

import { useParams } from "next/navigation";
import NoticeDetail from "@/components/board/NoticeDetail";

export default function NoticeDetailPage() {
  const params = useParams();
  const noticeId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <NoticeDetail noticeId={noticeId} />
    </div>
  );
}

