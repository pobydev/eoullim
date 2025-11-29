"use client";

import { ClassRoster, Cell, SeatAssignment, Zone } from "@/types";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrintViewProps {
  rows: number;
  cols: number;
  cells: Cell[];
  assignments: SeatAssignment[];
  selectedRoster: ClassRoster | null;
  zones: Zone[];
  layoutType?: "기본형" | "분단형" | "모둠형(4인)";
  viewMode: "teacher" | "student";
}

export default function PrintView({
  rows,
  cols,
  cells,
  assignments,
  selectedRoster,
  zones,
  layoutType = "기본형",
  viewMode,
}: PrintViewProps) {
  const getCell = (r: number, c: number) => {
    return cells.find((cell) => cell.r === r && cell.c === c);
  };

  const getAssignment = (r: number, c: number) => {
    return assignments.find((a) => a.seat.r === r && a.seat.c === c);
  };

  const getStudent = (studentId: string | null) => {
    if (!studentId || !selectedRoster) return null;
    return selectedRoster.students.find((s) => s.id === studentId);
  };

  const handlePrint = () => {
    // 인쇄 다이얼로그 열기 전에 사용자에게 안내
    // 참고: 브라우저의 인쇄 설정에서 "헤더 및 푸터" 옵션을 끄면 완전히 제거됩니다
    window.print();
  };

  const getZoneColorClass = (zoneId: string | null) => {
    if (!zoneId) return "";
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return "";

    const colorMap: Record<string, string> = {
      lime: "border-lime-400 border-2",
      yellow: "border-yellow-400 border-2",
      rose: "border-rose-400 border-2",
      violet: "border-violet-400 border-2",
      orange: "border-orange-400 border-2",
    };
    return colorMap[zone.color] || "border-gray-400 border-2";
  };

  return (
    <div className="p-8 bg-white print:p-0 print:m-0 print:flex print:flex-col print:justify-center print:items-center print:min-h-screen">
      <div className="mb-4 flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">인쇄 미리보기</h2>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          인쇄
        </Button>
      </div>

      <div
        className={cn(
          "flex flex-col items-center w-full max-w-6xl mx-auto print:w-full print:max-w-none",
          viewMode === "teacher" && "transform rotate-180"
        )}
        style={{
          ...(viewMode === "teacher" ? { transform: "rotate(180deg)" } : {}),
        }}
      >
        {/* 칠판/교탁 */}
        <div
          className="flex justify-center mb-6"
          style={viewMode === "teacher" ? { transform: "rotate(180deg)" } : {}}
        >
          <div className="bg-slate-700 text-white px-28 py-4 rounded-lg text-lg font-semibold shadow-xl">
            칠판
          </div>
        </div>

        {/* 그리드 */}
        {layoutType === "분단형" ? (
          // 분단형 레이아웃: 2열씩 그룹화, 그룹 간 큰 간격
          <div className="flex gap-12 justify-center mx-auto">
            {Array.from({ length: Math.floor(cols / 2) }).map(
              (_, groupIndex) => {
                const startCol = groupIndex * 2;

                return (
                  <div
                    key={groupIndex}
                    className="grid gap-0"
                    style={{
                      gridTemplateColumns: `repeat(2, minmax(0, 1fr))`,
                      width: `${2 * 120}px`, // 각 분단의 너비 고정
                    }}
                  >
                    {Array.from({ length: rows }).map((_, r) =>
                      Array.from({ length: 2 }).map((_, localC) => {
                        const c = startCol + localC;
                        const cell = getCell(r, c);
                        const assignment = getAssignment(r, c);
                        const student = getStudent(
                          assignment?.studentId || null
                        );

                        if (!cell) return null;

                        return (
                          <div
                            key={`${r}-${c}`}
                            className={cn(
                              "w-full min-w-[120px] h-24 flex items-center justify-center border-2 rounded-md print:border-gray-400",
                              !cell.isActive &&
                                "bg-gray-100 border-gray-200 border-dashed",
                              cell.isActive &&
                                !assignment?.studentId &&
                                "print:bg-transparent print:border-transparent",
                              cell.isActive &&
                                !assignment?.studentId &&
                                "bg-white border-gray-300",
                              cell.isActive &&
                                assignment?.studentId &&
                                student &&
                                student.gender === "M" &&
                                "bg-primary/10 border",
                              cell.isActive &&
                                assignment?.studentId &&
                                student &&
                                student.gender === "F" &&
                                "bg-rose-50 border",
                              cell.isActive &&
                                assignment?.studentId &&
                                student &&
                                !student.gender &&
                                "bg-white border",
                              getZoneColorClass(cell.zoneId)
                            )}
                            style={
                              viewMode === "teacher"
                                ? { transform: "rotate(180deg)" }
                                : {}
                            }
                          >
                            {cell.isActive && (
                              <div className="text-center px-2 w-full">
                                {assignment?.studentId && student ? (
                                  <div className="font-semibold text-lg truncate flex items-center justify-center h-full">
                                    {student.attendanceNumber && (
                                      <span className="text-base font-normal text-gray-500 mr-1">
                                        {student.attendanceNumber}.
                                      </span>
                                    )}
                                    {student.name}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 print:hidden">
                                    {r + 1}-{c + 1}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              }
            )}
          </div>
        ) : layoutType === "모둠형(4인)" ? (
          // 모둠형 레이아웃: 2열씩 그룹화, 특정 행 사이에 복도
          <div className="flex gap-12 justify-center mx-auto">
            {Array.from({ length: Math.floor(cols / 2) }).map(
              (_, groupIndex) => {
                const startCol = groupIndex * 2;

                return (
                  <div
                    key={groupIndex}
                    className="flex flex-col"
                    style={{
                      width: `${2 * 120}px`,
                    }}
                  >
                    {Array.from({ length: rows }).map((_, r) => {
                      // 복도가 필요한 행: 2-3 사이, 4-5 사이 (0-based이므로 2, 4)
                      const needsAisle = r === 2 || r === 4;
                      const aisleHeight = "h-8"; // 복도 높이

                      return (
                        <div key={r}>
                          {/* 복도 */}
                          {needsAisle && <div className={aisleHeight} />}

                          {/* 행의 책상들 */}
                          <div className="grid grid-cols-2 gap-0 gap-y-2">
                            {Array.from({ length: 2 }).map((_, localC) => {
                              const c = startCol + localC;
                              const cell = getCell(r, c);
                              const assignment = getAssignment(r, c);
                              const student = getStudent(
                                assignment?.studentId || null
                              );

                              if (!cell) return null;

                              return (
                                <div
                                  key={`${r}-${c}`}
                                  className={cn(
                                    "w-full min-w-[120px] h-24 flex items-center justify-center border-2 rounded-md print:border-gray-400",
                                    !cell.isActive &&
                                      "bg-gray-100 border-gray-200 border-dashed",
                                    cell.isActive &&
                                      !assignment?.studentId &&
                                      "print:bg-transparent print:border-transparent",
                                    cell.isActive &&
                                      !assignment?.studentId &&
                                      "bg-white border-gray-300",
                                    cell.isActive &&
                                      assignment?.studentId &&
                                      student &&
                                      student.gender === "M" &&
                                      "bg-primary/10 border",
                                    cell.isActive &&
                                      assignment?.studentId &&
                                      student &&
                                      student.gender === "F" &&
                                      "bg-rose-50 border",
                                    cell.isActive &&
                                      assignment?.studentId &&
                                      student &&
                                      !student.gender &&
                                      "bg-white border",
                                    getZoneColorClass(cell.zoneId)
                                  )}
                                  style={
                                    viewMode === "teacher"
                                      ? { transform: "rotate(180deg)" }
                                      : {}
                                  }
                                >
                                  {cell.isActive && (
                                    <div className="text-center px-2 w-full">
                                      {assignment?.studentId && student ? (
                                        <div className="font-semibold text-lg truncate flex items-center justify-center h-full">
                                          {student.attendanceNumber && (
                                            <span className="text-base font-normal text-gray-500 mr-1">
                                              {student.attendanceNumber}.
                                            </span>
                                          )}
                                          {student.name}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-400 print:hidden">
                                          {r + 1}-{c + 1}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            )}
          </div>
        ) : (
          // 기본형 레이아웃: 모든 열이 동일한 간격
          <div
            className="grid gap-y-1 gap-x-12 mx-auto print:w-full print:max-w-full print:gap-y-1 print:gap-x-12"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(90px, 1fr))`,
              width: "fit-content",
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const cell = getCell(r, c);
                const assignment = getAssignment(r, c);
                const student = getStudent(assignment?.studentId || null);

                if (!cell) return null;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={cn(
                      "w-[120px] print:w-full print:min-w-[90px] h-24 print:h-[64px] flex items-center justify-center border-2 rounded-md print:border-gray-400",
                      !cell.isActive &&
                        "bg-gray-100 border-gray-200 border-dashed",
                      cell.isActive &&
                        !assignment?.studentId &&
                        "print:bg-transparent print:border-transparent",
                      cell.isActive &&
                        !assignment?.studentId &&
                        "bg-white border-gray-300",
                      cell.isActive &&
                        assignment?.studentId &&
                        student &&
                        student.gender === "M" &&
                        "bg-primary/10 border",
                      cell.isActive &&
                        assignment?.studentId &&
                        student &&
                        student.gender === "F" &&
                        "bg-rose-50 border",
                      cell.isActive &&
                        assignment?.studentId &&
                        student &&
                        !student.gender &&
                        "bg-white border",
                      getZoneColorClass(cell.zoneId)
                    )}
                    style={
                      viewMode === "teacher"
                        ? { transform: "rotate(180deg)" }
                        : {}
                    }
                  >
                    {cell.isActive && (
                      <div className="text-center px-2 w-full">
                        {assignment?.studentId && student ? (
                          <div className="font-semibold text-lg truncate flex items-center justify-center h-full">
                            {student.attendanceNumber && (
                              <span className="text-base font-normal text-gray-500 mr-1">
                                {student.attendanceNumber}.
                              </span>
                            )}
                            {student.name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 print:hidden">
                            {r + 1}-{c + 1}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
