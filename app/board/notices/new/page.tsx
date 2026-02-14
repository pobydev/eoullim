"use client";

import NoticeForm from "@/components/board/NoticeForm";
import RequireAdmin from "@/components/RequireAdmin";

export default function NewNoticePage() {
  return (
    <RequireAdmin>
      <NoticeForm />
    </RequireAdmin>
  );
}

