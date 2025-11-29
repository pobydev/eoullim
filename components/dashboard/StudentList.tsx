"use client";

import { useState, useEffect, useRef } from "react";
import { Student, SeatAssignment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentListProps {
  students: Student[];
  assignments: SeatAssignment[];
  onStudentUpdate: (students: Student[]) => void;
  isAnimating?: boolean;
}

export default function StudentList({
  students,
  assignments,
  onStudentUpdate,
  isAnimating = false,
}: StudentListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    gender: undefined as "M" | "F" | undefined,
    attendanceNumber: students.length + 1,
  });




  const handleAdd = () => {
    if (!newStudent.name.trim()) return;
    const student: Student = {
      id: `s${Date.now()}`,
      name: newStudent.name.trim(),
      gender: newStudent.gender,
      attendanceNumber: newStudent.attendanceNumber,
    };
    onStudentUpdate([...students, student]);
    setNewStudent({
      name: "",
      gender: undefined,
      attendanceNumber: students.length + 2,
    });
    setIsAddDialogOpen(false);
  };

  const handleDelete = (studentId: string) => {
    if (confirm("정말 이 학생을 삭제하시겠습니까?")) {
      const updated = students.filter((s) => s.id !== studentId);
      onStudentUpdate(updated);
    }
  };

  // 순차 배치 중일 때는 이전 assignments를 유지
  const stableAssignmentsRef = useRef<SeatAssignment[]>(assignments);
  
  useEffect(() => {
    if (!isAnimating) {
      // 애니메이션이 끝나면 최신 assignments로 업데이트
      stableAssignmentsRef.current = assignments;
    }
  }, [assignments, isAnimating]);

  const getAssignedSeat = (studentId: string) => {
    // 순차 배치 중일 때는 안정적인 assignments 사용
    const currentAssignments = isAnimating ? stableAssignmentsRef.current : assignments;
    const assignment = currentAssignments.find((a) => a.studentId === studentId);
    return assignment ? `${assignment.seat.r + 1}행 ${assignment.seat.c + 1}열` : null;
  };

  const sortedStudents = [...students].sort((a, b) => {
    const numA = a.attendanceNumber || 0;
    const numB = b.attendanceNumber || 0;
    return numA - numB;
  });

  return (
    <div className="h-full flex flex-col min-h-0">
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <Users className="mr-2 h-4 w-4" />
              학생 목록 ({students.length}명)
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-2">
            {sortedStudents.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                학생이 없습니다. 추가해주세요.
              </div>
            ) : (
              sortedStudents.map((student) => {
                const seat = getAssignedSeat(student.id);
                return (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 border rounded-md",
                      student.gender === "M" && "bg-primary/10 hover:bg-primary/20",
                      student.gender === "F" && "bg-rose-50 hover:bg-rose-100",
                      !student.gender && "hover:bg-gray-50"
                    )}
                  >
                    <div className="w-10 text-center text-sm font-semibold text-gray-600 flex-shrink-0">
                      {student.attendanceNumber || "-"}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
                      <div className="font-medium text-sm truncate tracking-wide text-center w-full">{student.name}</div>
                      {seat && (
                        <div className="text-xs text-gray-500 mt-0.5 text-center">{seat}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 w-10 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 학생 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학생 추가</DialogTitle>
            <DialogDescription>
              새로운 학생 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">이름</Label>
              <Input
                id="new-name"
                placeholder="학생 이름"
                value={newStudent.name}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-attendance">출석번호</Label>
              <Input
                id="new-attendance"
                type="number"
                min="1"
                value={newStudent.attendanceNumber}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    attendanceNumber: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-gender">성별 (선택사항)</Label>
              <Select
                value={newStudent.gender || "none"}
                onValueChange={(value: "M" | "F" | "none") =>
                  setNewStudent({ ...newStudent, gender: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger id="new-gender">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  <SelectItem value="M">남</SelectItem>
                  <SelectItem value="F">여</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAdd}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
