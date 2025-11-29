"use client";

import { useParams } from "next/navigation";
import FeedbackDetail from "@/components/board/FeedbackDetail";

export default function FeedbackDetailPage() {
  const params = useParams();
  const feedbackId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <FeedbackDetail feedbackId={feedbackId} />
    </div>
  );
}

