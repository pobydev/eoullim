"use client";

import { useState, useEffect } from "react";
import { Feedback } from "@/types";
import { getFeedback, incrementFeedbackViewCount, deleteFeedback, isAdmin } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, ArrowLeft, Edit, Trash2, AlertCircle, Lightbulb, MessageSquare, HelpCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import CommentList from "./CommentList";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FeedbackDetailProps {
  feedbackId: string;
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

export default function FeedbackDetail({ feedbackId }: FeedbackDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (feedbackId) {
      loadFeedback();
    }
  }, [feedbackId]);

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

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await getFeedback(feedbackId);
      if (data) {
        setFeedback(data);
        // 조회수 증가 (세션 스토리지로 중복 방지)
        const viewedKey = `feedback_viewed_${feedbackId}`;
        if (!sessionStorage.getItem(viewedKey)) {
          await incrementFeedbackViewCount(feedbackId);
          sessionStorage.setItem(viewedKey, "true");
        }
      }
    } catch (error) {
      console.error("Q&A 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFeedback(feedbackId);
      router.push("/board");
    } catch (error) {
      console.error("Q&A 삭제 실패:", error);
      alert("Q&A 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Q&A를 찾을 수 없습니다.
        </CardContent>
      </Card>
    );
  }

  const timeAgo = feedback.createdAt
    ? formatDistanceToNow(new Date(feedback.createdAt), {
        addSuffix: true,
        locale: ko,
      })
    : "";

  const CategoryIcon = categoryIcons[feedback.category] || HelpCircle;
  const canEdit = user && (user.uid === feedback.authorId || isUserAdmin);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-4">
          <Link href="/board">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>

          <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon className="h-5 w-5 text-sky-500" />
                <span className="text-sm text-gray-600">{feedback.category}</span>
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    statusColors[feedback.status]
                  )}
                >
                  {feedback.status}
                </span>
              </div>
              <CardTitle className="text-2xl font-bold mb-2">
                {feedback.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {timeAgo}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {feedback.viewCount}
                </span>
                <span>{feedback.authorName}</span>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Link href={`/board/feedbacks/${feedbackId}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="mb-6 prose prose-sky max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(feedback.content),
            }}
          />

          {feedback.adminReply && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">관리자 답변</h3>
              <div
                className="prose prose-sky max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(feedback.adminReply),
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <CommentList 
        postId={feedbackId} 
        postType="feedback"
        onCommentAdded={loadFeedback}
        onCommentDeleted={loadFeedback}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Q&A 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 Q&A를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 관련 댓글도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
          </AlertDialog>
      </div>
    </div>
  );
}

