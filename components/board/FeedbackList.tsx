"use client";

import { useState, useEffect } from "react";
import { Feedback, FeedbackCategory, FeedbackStatus } from "@/types";
import { getFeedbacks, GetFeedbacksOptions } from "@/lib/firestore";
import FeedbackCard from "./FeedbackCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<FeedbackCategory | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFeedbacks();
  }, [category, status]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const options: GetFeedbacksOptions = {
        ...(category !== "all" && { category }),
        ...(status !== "all" && { status }),
        ...(searchQuery && { searchQuery }),
      };
      const data = await getFeedbacks(options);
      setFeedbacks(data);
    } catch (error) {
      console.error("Q&A 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadFeedbacks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="제목 또는 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={category} onValueChange={(value) => setCategory(value as FeedbackCategory | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            <SelectItem value="질문">질문</SelectItem>
            <SelectItem value="기능제안">기능제안</SelectItem>
            <SelectItem value="불편사항">불편사항</SelectItem>
            <SelectItem value="기타">기타</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as FeedbackStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="답변 대기">답변 대기</SelectItem>
            <SelectItem value="답변 중">답변 중</SelectItem>
            <SelectItem value="답변 완료">답변 완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Q&A가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </div>
      )}
    </div>
  );
}

