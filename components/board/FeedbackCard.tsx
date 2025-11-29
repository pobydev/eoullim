"use client";

import { Feedback } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Calendar, AlertCircle, Lightbulb, MessageSquare, HelpCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FeedbackCardProps {
  feedback: Feedback;
}

const categoryIcons = {
  질문: HelpCircle,
  기능제안: Lightbulb,
  불편사항: MessageSquare,
  기타: HelpCircle,
};

const statusColors = {
  "답변 대기": "bg-gray-100 text-gray-700",
  "답변 중": "bg-blue-100 text-blue-700",
  "답변 완료": "bg-green-100 text-green-700",
};

export default function FeedbackCard({ feedback }: FeedbackCardProps) {
  const timeAgo = feedback.createdAt
    ? formatDistanceToNow(new Date(feedback.createdAt), {
        addSuffix: true,
        locale: ko,
      })
    : "";

  const CategoryIcon = categoryIcons[feedback.category] || HelpCircle;

  return (
    <Link href={`/board/feedbacks/${feedback.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">
              {feedback.title}
            </CardTitle>
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                statusColors[feedback.status]
              )}
            >
              {feedback.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <CategoryIcon className="h-4 w-4 text-sky-500" />
            <span className="text-sm text-gray-600">{feedback.category}</span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {feedback.content.replace(/[#*`]/g, "").substring(0, 100)}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {feedback.viewCount}
            </span>
            <span className="text-gray-400">{feedback.authorName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

