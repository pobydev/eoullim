"use client";

import { useState, useEffect } from "react";
import { Notice } from "@/types";
import { createNotice, updateNotice } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "./RichTextEditor";
import { Loader2 } from "lucide-react";

interface NoticeFormProps {
  notice?: Notice;
}

export default function NoticeForm({ notice }: NoticeFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
      setIsPinned(notice.isPinned);
    }
  }, [notice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      if (notice) {
        await updateNotice(notice.id, {
          title: title.trim(),
          content: content.trim(),
          isPinned,
        });
      } else {
        await createNotice({
          title: title.trim(),
          content: content.trim(),
          authorId: user.uid,
          authorName: user.displayName || user.email?.split("@")[0] || "익명",
          authorEmail: user.email || "",
          isPinned,
        });
      }
      router.push("/board/notices");
    } catch (error) {
      console.error("공지사항 저장 실패:", error);
      alert("공지사항 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{notice ? "공지사항 수정" : "공지사항 작성"}</CardTitle>
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
              <Label htmlFor="content">내용</Label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
              />
              <Label htmlFor="isPinned" className="cursor-pointer">
                상단 고정
              </Label>
            </div>

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

