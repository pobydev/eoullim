"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { ClassRoster, SeatAssignment } from "@/types";
import RosterDialog from "./RosterDialog";
import EditRosterDialog from "./EditRosterDialog";
import StudentList from "./StudentList";
import { Plus, Users, Trash2, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface RosterManagerProps {
  rosters: ClassRoster[];
  selectedRoster: ClassRoster | null;
  onSelectRoster: (roster: ClassRoster | null) => void;
  onDeleteRoster: (rosterId: string) => void;
  onRosterSaved: () => void;
  assignments?: SeatAssignment[];
  isAnimating?: boolean;
  onRosterUpdate?: (roster: ClassRoster) => void;
}

export default function RosterManager({
  rosters,
  selectedRoster,
  onSelectRoster,
  onDeleteRoster,
  onRosterSaved,
  assignments = [],
  isAnimating = false,
  onRosterUpdate,
}: RosterManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<ClassRoster | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRosterIds, setSelectedRosterIds] = useState<Set<string>>(
    new Set()
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleStudentUpdate = (updatedStudents: ClassRoster["students"]) => {
    if (selectedRoster && onRosterUpdate) {
      const updatedRoster = {
        ...selectedRoster,
        students: updatedStudents,
      };
      onRosterUpdate(updatedRoster);
    }
  };

  const handleToggleRosterSelection = (rosterId: string) => {
    const newSelected = new Set(selectedRosterIds);
    if (newSelected.has(rosterId)) {
      newSelected.delete(rosterId);
    } else {
      newSelected.add(rosterId);
    }
    setSelectedRosterIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRosterIds.size === rosters.length) {
      setSelectedRosterIds(new Set());
    } else {
      setSelectedRosterIds(new Set(rosters.map((r) => r.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRosterIds.size === 0) return;
    setDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedRosterIds.forEach((rosterId) => {
      onDeleteRoster(rosterId);
    });
    setSelectedRosterIds(new Set());
    if (selectedRoster && selectedRosterIds.has(selectedRoster.id)) {
      onSelectRoster(null);
    }
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex-shrink-0 space-y-4">
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="w-full"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />새 학급 추가
        </Button>

        <RosterDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSaved={onRosterSaved}
        />

        <EditRosterDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          roster={editingRoster}
          onSaved={onRosterSaved}
        />

        <div className="space-y-2">
          <Label htmlFor="roster-select">학급 선택</Label>
          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between",
                  !selectedRoster && "text-muted-foreground"
                )}
              >
                {selectedRoster ? (
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{selectedRoster.className}</span>
                    <span className="ml-2 text-gray-500 text-sm">
                      ({selectedRoster.students.length}명)
                    </span>
                  </div>
                ) : (
                  "학급을 선택하세요"
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
              sideOffset={4}
            >
              <div className="p-3">
                {rosters.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    저장된 학급이 없습니다
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-2 py-3 border-b mb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={
                            selectedRosterIds.size === rosters.length &&
                            rosters.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                        <Label className="text-sm font-medium">
                          전체 선택 ({selectedRosterIds.size}/{rosters.length})
                        </Label>
                      </div>
                      {selectedRosterIds.size > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkDelete();
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제 ({selectedRosterIds.size})
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <div
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors",
                          !selectedRoster && "bg-gray-50"
                        )}
                        onClick={() => {
                          onSelectRoster(null);
                          setDropdownOpen(false);
                        }}
                      >
                        <span className="text-sm text-gray-500">선택 안 함</span>
                      </div>
                      {rosters.map((roster) => (
                        <div
                          key={roster.id}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-gray-50 transition-colors",
                            selectedRoster?.id === roster.id && "bg-sky-50"
                          )}
                        >
                          <div
                            className="flex items-center space-x-3 flex-1 cursor-pointer"
                            onClick={() => {
                              onSelectRoster(roster);
                              setDropdownOpen(false);
                            }}
                          >
                            <Checkbox
                              checked={selectedRosterIds.has(roster.id)}
                              onCheckedChange={() =>
                                handleToggleRosterSelection(roster.id)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {roster.className}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {roster.students.length}명
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRoster(roster);
                                setIsEditDialogOpen(true);
                                setDropdownOpen(false);
                              }}
                              className="text-blue-500 hover:text-blue-700 h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRosterIds(new Set([roster.id]));
                                setDeleteConfirmOpen(true);
                              }}
                              className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedRosterIds.size > 1 ? "학급 삭제 확인" : "학급 삭제 확인"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRosterIds.size > 1 ? (
                <>
                  선택한 {selectedRosterIds.size}개의 학급을 삭제하시겠습니까?
                  <br />
                  삭제된 학급의 모든 학생 정보와 자리표 정보가 함께 삭제되며
                  복구할 수 없습니다.
                </>
              ) : (
                <>
                  정말 이 학급을 삭제하시겠습니까? 삭제된 학급의 모든 학생
                  정보와 자리표 정보가 함께 삭제되며 복구할 수 없습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedRoster && (
        <div className="flex-1 min-h-0 flex flex-col">
          <StudentList
            students={selectedRoster.students}
            assignments={assignments}
            onStudentUpdate={handleStudentUpdate}
            isAnimating={isAnimating}
          />
        </div>
      )}
    </div>
  );
}
