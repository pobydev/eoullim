"use client";

import { useState } from "react";
import { PostType } from "@/types";
import { createComment, isAdmin } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface CommentFormProps {
  postId: string;
  postType: PostType;
  onCommentAdded: () => void;
}

export default function CommentForm({
  postId,
  postType,
  onCommentAdded,
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    try {
      setSubmitting(true);
      
      // 관리자 여부 확인
      const admin = await isAdmin(user.uid, user.email || undefined);
      
      await createComment({
        postId,
        postType,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split("@")[0] || "익명",
        authorEmail: user.email || "",
        content: content.trim(),
      }, admin);  // 관리자 여부 전달
      
      setContent("");
      onCommentAdded();
    } catch (error: any) {
      console.error("댓글 작성 실패:", error);
      const errorMessage = error?.message || "댓글 작성에 실패했습니다.";
      alert(`댓글 작성 실패: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center text-gray-500 py-4">
        댓글을 작성하려면 로그인이 필요합니다.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="댓글을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={submitting}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!content.trim() || submitting} size="sm">
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "작성 중..." : "작성"}
        </Button>
      </div>
    </form>
  );
}

