"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Layout } from "@/types";
import { Calendar, Trash2 } from "lucide-react";

interface LayoutListProps {
  layouts: Layout[];
  selectedLayout: Layout | null;
  onSelectLayout: (layout: Layout | null) => void;
  onDeleteLayout: (layoutId: string) => void;
}

export default function LayoutList({
  layouts,
  selectedLayout,
  onSelectLayout,
  onDeleteLayout,
}: LayoutListProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<string | null>(null);
  const [selectedLayoutIds, setSelectedLayoutIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // 최신순으로 정렬 (createdAt이 최신인 것이 위로)
  const sortedLayouts = [...layouts].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // 내림차순 (최신이 위로)
  });

  const handleDeleteClick = (e: React.MouseEvent, layoutId: string) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    setLayoutToDelete(layoutId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (layoutToDelete) {
      onDeleteLayout(layoutToDelete);
      if (selectedLayout?.id === layoutToDelete) {
        onSelectLayout(null);
      }
      setLayoutToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleToggleLayoutSelection = (layoutId: string) => {
    const newSelected = new Set(selectedLayoutIds);
    if (newSelected.has(layoutId)) {
      newSelected.delete(layoutId);
    } else {
      newSelected.add(layoutId);
    }
    setSelectedLayoutIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLayoutIds.size === sortedLayouts.length) {
      setSelectedLayoutIds(new Set());
    } else {
      setSelectedLayoutIds(new Set(sortedLayouts.map((l) => l.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedLayoutIds.size === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = Array.from(selectedLayoutIds);
    // 모든 삭제를 병렬로 실행
    await Promise.all(idsToDelete.map((layoutId) => onDeleteLayout(layoutId)));
    
    if (selectedLayout && selectedLayoutIds.has(selectedLayout.id)) {
      onSelectLayout(null);
    }
    setSelectedLayoutIds(new Set());
    setBulkDeleteConfirmOpen(false);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {sortedLayouts.length > 0 && (
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedLayoutIds.size === sortedLayouts.length && sortedLayouts.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              전체 선택
            </label>
          </div>
          {selectedLayoutIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제 ({selectedLayoutIds.size})
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {sortedLayouts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              저장된 자리표가 없습니다.
            </CardContent>
          </Card>
        ) : (
          sortedLayouts.map((layout) => (
            <Card
              key={layout.id}
              className={`cursor-pointer transition-colors ${
                selectedLayout?.id === layout.id
                  ? "border-sky-500 bg-sky-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onSelectLayout(layout)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedLayoutIds.has(layout.id)}
                      onCheckedChange={() => handleToggleLayoutSelection(layout.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{layout.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                    onClick={(e) => handleDeleteClick(e, layout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {layout.config.layoutType === "분단형" ? (
                    <>
                      {Math.floor(layout.config.cols / 2)}분단 {layout.config.rows}행
                    </>
                  ) : (
                    <>
                      {layout.config.cols}열 × {layout.config.rows}행
                    </>
                  )}
                </p>
                {layout.createdAt && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {layout.createdAt.toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>자리표 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 자리표를 삭제하시겠습니까? 삭제된 자리표는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>자리표 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedLayoutIds.size}개의 자리표를 삭제하시겠습니까? 삭제된 자리표는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteConfirmOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-500 hover:bg-red-600">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

