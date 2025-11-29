"use client";

import FeedbackList from "@/components/board/FeedbackList";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FeedbacksPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/board">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                게시판으로
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Q&A
            </h1>
          </div>
          <Link href="/board/feedbacks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              작성
            </Button>
          </Link>
        </div>

      <FeedbackList />
    </div>
  );
}

