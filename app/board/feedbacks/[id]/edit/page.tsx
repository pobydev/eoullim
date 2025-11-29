"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Feedback } from "@/types";
import { getFeedback } from "@/lib/firestore";
import FeedbackForm from "@/components/board/FeedbackForm";
import { Loader2 } from "lucide-react";

export default function EditFeedbackPage() {
  const params = useParams();
  const feedbackId = params.id as string;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (feedbackId) {
      loadFeedback();
    }
  }, [feedbackId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await getFeedback(feedbackId);
      setFeedback(data);
    } catch (error) {
      console.error("Q&A 로드 실패:", error);
    } finally {
      setLoading(false);
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-center text-gray-500">Q&A를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return <FeedbackForm feedback={feedback} />;
}

