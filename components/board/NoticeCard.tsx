"use client";

import { Notice } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pin, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface NoticeCardProps {
  notice: Notice;
}

export default function NoticeCard({ notice }: NoticeCardProps) {
  const timeAgo = notice.createdAt
    ? formatDistanceToNow(new Date(notice.createdAt), {
        addSuffix: true,
        locale: ko,
      })
    : "";

  return (
    <Link href={`/board/notices/${notice.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {notice.isPinned && (
                <Pin className="inline-block h-4 w-4 text-yellow-500 mr-2" />
              )}
              {notice.title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {notice.content.replace(/[#*`]/g, "").substring(0, 100)}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {notice.viewCount}
            </span>
            <span className="text-gray-400">{notice.authorName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

