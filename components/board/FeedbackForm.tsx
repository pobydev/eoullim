"use client";

import { useState, useEffect } from "react";
import { Feedback, FeedbackCategory, FeedbackStatus } from "@/types";
import { createFeedback, updateFeedback } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "./RichTextEditor";
import { Loader2 } from "lucide-react";
import { isAdmin } from "@/lib/firestore";

interface FeedbackFormProps {
  feedback?: Feedback;
}

export default function FeedbackForm({ feedback }: FeedbackFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("질문");
  const [status, setStatus] = useState<FeedbackStatus>("답변 대기");
  const [adminReply, setAdminReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    if (feedback) {
      setTitle(feedback.title);
      setContent(feedback.content);
      setCategory(feedback.category);
      setStatus(feedback.status);
      setAdminReply(feedback.adminReply || "");
    }
  }, [feedback]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      if (feedback) {
        const updates: Partial<Feedback> = {
          title: title.trim(),
          content: content.trim(),
          category,
        };

        // 관리자만 상태와 답변 수정 가능
        if (isUserAdmin) {
          updates.status = status;
          if (adminReply.trim()) {
            updates.adminReply = adminReply.trim();
            updates.repliedAt = new Date();
          }
        }

        await updateFeedback(feedback.id, updates);
      } else {
        await createFeedback({
          title: title.trim(),
          content: content.trim(),
          category,
          authorId: user.uid,
          authorName: user.displayName || user.email?.split("@")[0] || "익명",
          authorEmail: user.email || "",
        });
      }
      router.push("/board/feedbacks");
    } catch (error) {
      console.error("Q&A 저장 실패:", error);
      alert("Q&A 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const canEditStatus = isUserAdmin && feedback;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{feedback ? "Q&A 수정" : "Q&A 작성"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as FeedbackCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="질문">질문</SelectItem>
                  <SelectItem value="기능제안">기능제안</SelectItem>
                  <SelectItem value="불편사항">불편사항</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            {canEditStatus && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status">상태</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as FeedbackStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="답변 대기">답변 대기</SelectItem>
                      <SelectItem value="답변 중">답변 중</SelectItem>
                      <SelectItem value="답변 완료">답변 완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminReply">관리자 답변</Label>
                  <RichTextEditor value={adminReply} onChange={setAdminReply} />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

