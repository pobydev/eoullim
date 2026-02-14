"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveClassRoster } from "@/lib/firestore";
import { ClassRoster, Student } from "@/types";
import { Trash2, Plus, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface RosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function RosterDialog({
  open,
  onOpenChange,
  onSaved,
}: RosterDialogProps) {
  const { user } = useAuth();
  const [className, setClassName] = useState("");
  const [rosterText, setRosterText] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // 다이얼로그가 열릴 때 기본 학생 한 명 추가
      if (students.length === 0) {
        handleAddStudent();
      }
    } else {
      // 다이얼로그가 닫힐 때 초기화
      setClassName("");
      setRosterText("");
      setStudents([]);
      setShowPasteArea(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parseRoster = (text: string): Student[] => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.map((line, index) => {
      // 엑셀 복사 붙여넣기 형식 지원 (탭, 쉼표, 또는 여러 공백으로 구분)
      // 먼저 탭으로 분리 시도, 없으면 쉼표, 없으면 여러 공백으로 분리
      let parts: string[];
      if (line.includes("\t")) {
        // 탭으로 구분된 경우
        parts = line
          .split("\t")
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
      } else if (line.includes(",")) {
        // 쉼표로 구분된 경우
        parts = line
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
      } else {
        // 공백으로 구분된 경우 (연속된 공백을 하나로 처리)
        parts = line
          .split(/\s+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
      }

      let attendanceNumber: number | undefined;
      let name: string = "";
      let gender: "M" | "F" | undefined = undefined;

      // 파싱 로직: 숫자, 이름, 성별을 구분
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // 출석번호 확인 (숫자만 있는 경우)
        if (/^\d+$/.test(part)) {
          const num = parseInt(part);
          if (num > 0 && num <= 100) {
            attendanceNumber = num;
            continue;
          }
        }

        // 성별 확인
        const partLower = part.toLowerCase();
        if (
          partLower === "남" ||
          partLower === "m" ||
          partLower === "남자" ||
          partLower === "male"
        ) {
          gender = "M";
          continue;
        }
        if (
          partLower === "여" ||
          partLower === "f" ||
          partLower === "여자" ||
          partLower === "female"
        ) {
          gender = "F";
          continue;
        }

        // 이름 (숫자가 아니고 성별이 아닌 경우)
        if (part.length > 0 && !/^\d+$/.test(part)) {
          name = part;
        }
      }

      // 이름이 없으면 첫 번째 비어있지 않은 부분을 이름으로 사용
      if (!name && parts.length > 0) {
        const firstNonNumber = parts.find(
          (p) => !/^\d+$/.test(p) && !/^[남여MF남자여자]$/i.test(p)
        );
        name = firstNonNumber || parts[0] || line;
      }

      // 출석번호가 없으면 인덱스 기반으로 생성
      if (!attendanceNumber) {
        attendanceNumber = index + 1;
      }

      return {
        id: `s${Date.now()}-${index}`,
        name: name || `학생${index + 1}`,
        gender,
        attendanceNumber,
      };
    });
  };

  const handleAddStudent = () => {
    const newStudent: Student = {
      id: `s${Date.now()}-${students.length}`,
      name: "",
      gender: undefined,
      attendanceNumber: students.length + 1,
    };
    setStudents([...students, newStudent]);
  };

  const handlePaste = () => {
    if (!rosterText.trim()) return;
    const parsedStudents = parseRoster(rosterText);
    setStudents(parsedStudents);
    setShowPasteArea(false);
    setRosterText("");
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
  };

  const handleUpdateStudent = (
    id: string,
    field: keyof Student,
    value: Student[keyof Student]
  ) => {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    if (!user || !className.trim() || students.length === 0) {
      return;
    }

    // 이름이 없는 학생 제거
    const validStudents = students.filter((s) => s.name.trim().length > 0);

    if (validStudents.length === 0) {
      alert("최소 한 명의 학생 정보를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // undefined 값을 가진 필드를 제거하여 Firestore 저장 시 문제 방지
      const cleanedStudents: Student[] = validStudents.map((s) => {
        const cleaned: Student = {
          id: s.id,
          name: s.name,
        };
        if (s.attendanceNumber !== undefined)
          cleaned.attendanceNumber = s.attendanceNumber;
        if (s.gender !== undefined) cleaned.gender = s.gender;
        return cleaned;
      });

      const roster: ClassRoster = {
        id: `roster-${Date.now()}`,
        className: className.trim(),
        students: cleanedStudents,
      };

      await saveClassRoster(user.uid, roster);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("학급 저장 실패:", error);
      alert("학급 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 학급 추가</DialogTitle>
          <DialogDescription>
            반 이름을 입력하고 학생 목록을 추가하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="className">반 이름</Label>
            <Input
              id="className"
              placeholder="예: 1학년 3반 (2025학년도)"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          {showPasteArea ? (
            <div className="space-y-2">
              <Label htmlFor="rosterText">
                엑셀 명렬표에서 붙여넣거나 직접 입력하세요
              </Label>
              <Textarea
                id="rosterText"
                placeholder={`엑셀에서 출석번호, 이름, 성별 컬럼을 선택하여 복사한 후 붙여넣으세요.
성별은 선택사항입니다.

예시:
1	김철수	남
2	이영희	여
3	박민수

또는:
1, 김철수, 남
2, 이영희, 여
3, 박민수`}
                value={rosterText}
                onChange={(e) => setRosterText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-2">
                <Button onClick={handlePaste} disabled={!rosterText.trim()}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  붙여넣기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasteArea(false);
                    if (students.length === 0) {
                      handleAddStudent();
                    }
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>학생 목록</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasteArea(true)}
                  >
                    <Clipboard className="mr-2 h-4 w-4" />
                    엑셀 붙여넣기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddStudent}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    학생 추가
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold border-b">
                          출석번호
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold border-b">
                          이름
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold border-b">
                          성별
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold border-b w-16">
                          삭제
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr
                          key={student.id}
                          className="hover:bg-gray-50 border-b"
                        >
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={student.attendanceNumber || index + 1}
                              onChange={(e) =>
                                handleUpdateStudent(
                                  student.id,
                                  "attendanceNumber",
                                  parseInt(e.target.value) || index + 1
                                )
                              }
                              className="w-20"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              value={student.name}
                              onChange={(e) =>
                                handleUpdateStudent(
                                  student.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="이름 입력"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant={
                                  student.gender === "M" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  handleUpdateStudent(
                                    student.id,
                                    "gender",
                                    student.gender === "M" ? undefined : "M"
                                  )
                                }
                                className={cn(
                                  "h-7 px-2.5 text-xs",
                                  student.gender === "M"
                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                    : "border-primary/30 text-primary hover:bg-primary/10",
                                  !student.gender && "opacity-50"
                                )}
                              >
                                남
                              </Button>
                              <Button
                                variant={
                                  student.gender === "F" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  handleUpdateStudent(
                                    student.id,
                                    "gender",
                                    student.gender === "F" ? undefined : "F"
                                  )
                                }
                                className={cn(
                                  "h-7 px-2.5 text-xs",
                                  student.gender === "F"
                                    ? "bg-rose-400 hover:bg-rose-500 text-white"
                                    : "border-rose-300 text-rose-500 hover:bg-rose-50",
                                  !student.gender && "opacity-50"
                                )}
                              >
                                여
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student.id)}
                              className="mx-auto"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      학생이 없습니다. 엑셀 명렬표에서 붙여넣거나 직접
                      입력해주세요.
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                💡 학생 목록은 출석번호 순으로 정렬됩니다. 이름이 비어있는 행은
                저장 시 제외됩니다.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          {!showPasteArea && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  loading ||
                  !className?.trim() ||
                  !students.some(
                    (s) => s.name?.trim() && s.name.trim().length > 0
                  )
                }
              >
                {loading ? "저장 중..." : "저장"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
