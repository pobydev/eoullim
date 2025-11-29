"use client";

import { useState, useEffect } from "react";
import { Comment, PostType } from "@/types";
import { getComments } from "@/lib/firestore";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface CommentListProps {
  postId: string;
  postType: PostType;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export default function CommentList({ postId, postType, onCommentAdded, onCommentDeleted }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId, postType]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(postId, postType);
      setComments(data);
    } catch (error: any) {
      console.error("댓글 로드 실패:", error);
      // 인덱스 오류인 경우 사용자에게 알림
      if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
        console.warn("Firestore 인덱스가 필요합니다. Firebase Console에서 인덱스를 생성해주세요.");
      }
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          댓글 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentForm 
          postId={postId} 
          postType={postType} 
          onCommentAdded={() => {
            loadComments();
            if (onCommentAdded) {
              onCommentAdded();
            }
          }} 
        />
        {loading ? (
          <div className="text-center text-gray-500 py-4">로딩 중...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-4">댓글이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postType={postType}
                onCommentUpdated={loadComments}
                onCommentDeleted={() => {
                  loadComments();
                  if (onCommentDeleted) {
                    onCommentDeleted();
                  }
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

