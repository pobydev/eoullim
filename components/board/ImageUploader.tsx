"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  maxSize?: number; // MB
}

export default function ImageUploader({
  onImageUploaded,
  maxSize = 5,
}: ImageUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`파일 크기는 ${maxSize}MB를 초과할 수 없습니다.`);
      return;
    }

    try {
      setUploading(true);
      const url = await uploadImage(file, user.uid);
      onImageUploaded(url);
    } catch (error: any) {
      console.error("이미지 업로드 실패:", error);
      alert(error.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-4 transition-colors",
        dragActive
          ? "border-sky-500 bg-sky-50"
          : "border-gray-300 hover:border-gray-400"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={uploading}
      />
      <div className="flex flex-col items-center justify-center gap-2">
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p className="text-sm text-gray-600">업로드 중...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-500">최대 {maxSize}MB</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              파일 선택
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

