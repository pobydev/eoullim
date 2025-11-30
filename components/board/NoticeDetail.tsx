"use client";

import { useState, useEffect } from "react";
import { Notice } from "@/types";
import { getNotice, incrementNoticeViewCount, deleteNotice, isAdmin } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, Eye, Calendar, ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { sanitizeHtml } from "@/lib/sanitize";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import CommentList from "./CommentList";
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

interface NoticeDetailProps {
  noticeId: string;
}

export default function NoticeDetail({ noticeId }: NoticeDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (noticeId) {
      loadNotice();
    }
  }, [noticeId]);

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

  const loadNotice = async () => {
    try {
      setLoading(true);
      const data = await getNotice(noticeId);
      if (data) {
        console.log("[NoticeDetail] Loaded notice content:", data.content);
        console.log("[NoticeDetail] Content type:", typeof data.content);
        console.log("[NoticeDetail] Content length:", data.content?.length);
        setNotice(data);
        // 조회수 증가 (세션 스토리지로 중복 방지)
        const viewedKey = `notice_viewed_${noticeId}`;
        if (!sessionStorage.getItem(viewedKey)) {
          await incrementNoticeViewCount(noticeId);
          sessionStorage.setItem(viewedKey, "true");
        }
      }
    } catch (error) {
      console.error("공지사항 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNotice(noticeId);
      router.push("/board");
    } catch (error) {
      console.error("공지사항 삭제 실패:", error);
      alert("공지사항 삭제에 실패했습니다.");
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
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          공지사항을 찾을 수 없습니다.
        </CardContent>
      </Card>
    );
  }

  const timeAgo = notice.createdAt
    ? formatDistanceToNow(new Date(notice.createdAt), {
        addSuffix: true,
        locale: ko,
      })
    : "";

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
              <CardTitle className="text-2xl font-bold mb-2">
                {notice.isPinned && (
                  <Pin className="inline-block h-5 w-5 text-yellow-500 mr-2" />
                )}
                {notice.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {timeAgo}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {notice.viewCount}
                </span>
                <span>{notice.authorName}</span>
              </div>
            </div>
            {isUserAdmin && (
              <div className="flex gap-2">
                <Link href={`/board/notices/${noticeId}/edit`}>
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
          {(() => {
            const sanitized = sanitizeHtml(notice.content);
            console.log("[NoticeDetail] Rendering - Original:", notice.content);
            console.log("[NoticeDetail] Rendering - Sanitized:", sanitized);
            return (
              <div
                className="prose prose-sky max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitized,
                }}
              />
            );
          })()}
        </CardContent>
      </Card>

          <CommentList 
            postId={noticeId} 
            postType="notice"
            onCommentAdded={loadNotice}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  정말 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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

