"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Card, CardContent } from "@/components/ui/card";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요... (마크다운 지원)",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">편집</TabsTrigger>
        <TabsTrigger value="preview">미리보기</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-4">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={15}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-2">
          마크다운 문법을 사용할 수 있습니다. **굵게**, *기울임*, `코드`, 링크, 이미지 등을 지원합니다.
        </p>
      </TabsContent>
      <TabsContent value="preview" className="mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="prose prose-sky max-w-none min-h-[200px]">
              {value ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-400">미리보기를 보려면 내용을 입력하세요.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

