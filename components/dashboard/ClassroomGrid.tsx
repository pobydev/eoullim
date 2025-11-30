"use client";

import { useState, useEffect } from "react";
import { ClassRoster, Cell, SeatAssignment, Zone } from "@/types";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassroomGridProps {
  rows: number;
  cols: number;
  cells: Cell[];
  assignments: SeatAssignment[];
  selectedRoster: ClassRoster | null;
  zones: Zone[];
  layoutType?: "기본형" | "분단형" | "모둠형(4인)";
  selectedZoneId?: string | null;
  onCellClick: (r: number, c: number) => void;
  isAnimating?: boolean;
  onAssignmentChange: (assignments: SeatAssignment[]) => void;
  isFullscreen?: boolean;
}

export default function ClassroomGrid({
  rows,
  cols,
  cells,
  assignments,
  selectedRoster,
  zones,
  layoutType = "기본형",
  selectedZoneId,
  onCellClick,
  isAnimating,
  onAssignmentChange,
  isFullscreen = false,
}: ClassroomGridProps) {
  const [selectedSeat, setSelectedSeat] = useState<{
    r: number;
    c: number;
  } | null>(null);

  // 이미지 프리로드
  useEffect(() => {
    const images = [
      "/classroom-background.png",
      "/desk-wood.png",
      "/desk-wood-boy.png",
      "/desk-wood-girl.png",
    ];

    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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

  const handleSeatClick = (r: number, c: number) => {
    // 지정구역 할당 모드에서는 자리 교환/고정 기능 비활성화
    if (selectedZoneId) {
      // 지정구역 할당 모드에서는 좌석 클릭을 onCellClick으로 전달
      onCellClick(r, c);
      return;
    }

    const assignment = getAssignment(r, c);

    if (selectedSeat) {
      // Swap 모드: 이미 선택된 좌석이 있으면 교환
      if (selectedSeat.r === r && selectedSeat.c === c) {
        // 같은 좌석을 다시 클릭하면 선택 해제
        setSelectedSeat(null);
      } else {
        // 다른 좌석을 클릭하면 교환
        const assignment1 = getAssignment(selectedSeat.r, selectedSeat.c);
        const assignment2 = assignment;

        const newAssignments = assignments.map((a) => {
          if (a.seat.r === selectedSeat.r && a.seat.c === selectedSeat.c) {
            return { ...a, studentId: assignment2?.studentId || null };
          }
          if (a.seat.r === r && a.seat.c === c) {
            return { ...a, studentId: assignment1?.studentId || null };
          }
          return a;
        });

        onAssignmentChange(newAssignments);
        setSelectedSeat(null);
      }
    } else if (assignment?.studentId) {
      // 학생이 배정된 좌석을 클릭하면 Swap 모드 시작
      setSelectedSeat({ r, c });
    } else {
      // 빈 좌석 클릭: 셀 토글
      onCellClick(r, c);
    }
  };

  const handleLockToggle = (r: number, c: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 상자 클릭 이벤트 전파 방지

    // 지정구역 할당 모드에서는 고정 기능 비활성화
    if (selectedZoneId) {
      return;
    }

    const newAssignments = assignments.map((a) =>
      a.seat.r === r && a.seat.c === c ? { ...a, isLocked: !a.isLocked } : a
    );
    onAssignmentChange(newAssignments);
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

  const getZoneHoverClass = (zoneId: string | null) => {
    if (!zoneId) return "";
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return "";

    const hoverColorMap: Record<string, string> = {
      lime: "hover:border-lime-400",
      yellow: "hover:border-yellow-400",
      rose: "hover:border-rose-400",
      violet: "hover:border-violet-400",
      orange: "hover:border-orange-400",
    };
    return hoverColorMap[zone.color] || "hover:border-gray-400";
  };

  // 전체화면 모드에서는 화면 크기에 맞게 자동 조정
  // 일반 모드에서는 행 수가 많아질수록(6행 이상) 책상 높이를 조금 줄여서 전체 교실에 잘 맞도록 조정
  // 컨테이너 크기는 최소 5행 기준으로 고정 (4행 이하일 때도 5행 크기 유지)
  const displayRows = Math.max(rows, 5); // 표시할 행 수 (최소 5행)
  const cellHeight = isFullscreen
    ? "h-28"
    : rows >= 6
    ? "h-[80px]"
    : "h-[97px]";
  const cellTextSize = isFullscreen
    ? "text-lg"
    : rows >= 6
    ? "text-sm"
    : "text-base";
  const cellIconSize = isFullscreen ? "h-4 w-4" : "h-3.5 w-3.5";
  const boardPadding = isFullscreen ? "px-32 py-5" : "px-28 py-4";
  const boardTextSize = isFullscreen ? "text-xl" : "text-lg";

  // 컨테이너 최소 높이 계산 (5행 기준)
  // 각 행 높이 + 행 간 gap (gap-y-2 = 8px)
  const rowHeight = rows >= 6 ? 80 : 97;
  const rowGap = 8;
  const minContainerHeight = rowHeight * 5 + rowGap * 4; // 5행 기준 높이

  return (
    <div
      className={cn(
        "relative mx-auto",
        isFullscreen ? "flex flex-col" : "w-full max-w-6xl"
      )}
      style={
        isFullscreen
          ? {
              width: "fit-content",
              height: "fit-content",
              minWidth: "fit-content",
            }
          : {}
      }
    >
      {/* 카드 컨테이너 */}
      <div
        className={cn(
          "rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden",
          isFullscreen ? "px-10 py-28" : "px-8 py-24"
        )}
        style={{
          // 교실 전체 배경 이미지 (컨테이너에 꽉 채움, 상단 기준)
          backgroundImage: "url('/classroom-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative z-10">
          {/* 그리드 */}
          {layoutType === "분단형" ? (
            // 분단형 레이아웃: 2열씩 그룹화, 그룹 간 큰 간격
            <div
              className={cn(
                "flex gap-12 justify-center mx-auto",
                isAnimating && "animate-pulse"
              )}
              style={{
                marginTop: "60px",
                minHeight: rows < 5 ? `${minContainerHeight}px` : undefined,
              }}
            >
              {Array.from({ length: Math.floor(cols / 2) }).map(
                (_, groupIndex) => {
                  const startCol = groupIndex * 2;
                  const endCol = startCol + 2;

                  return (
                    <div
                      key={groupIndex}
                      className="grid gap-0 gap-y-2"
                      style={{
                        gridTemplateColumns: `repeat(2, minmax(0, 1fr))`,
                        width: `${2 * 121}px`, // 각 분단의 너비 고정
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
                          const isSelected =
                            selectedSeat?.r === r && selectedSeat?.c === c;

                          if (!cell) return null;

                          return (
                            <div
                              key={`${r}-${c}`}
                              className={cn(
                                `w-full min-w-[121px] ${cellHeight} flex items-center justify-center border-transparent rounded-lg cursor-pointer transition-all duration-200 relative`,
                                !cell.isActive &&
                                  "opacity-0 hover:opacity-100 hover:bg-gray-100/50 hover:border-gray-300 hover:border-dashed",
                                cell.isActive &&
                                  "[&::before]:content-[''] [&::before]:absolute [&::before]:inset-[-14px] [&::before]:bg-cover [&::before]:bg-center [&::before]:bg-no-repeat [&::before]:rounded-lg [&::before]:pointer-events-none [&::before]:z-0 [&::before]:transition-transform [&::before]:duration-200",
                                cell.isActive &&
                                  !assignment?.studentId &&
                                  "[&::before]:bg-[url('/desk-wood.png')]",
                                cell.isActive &&
                                  assignment?.studentId &&
                                  student &&
                                  student.gender === "M" &&
                                  "[&::before]:bg-[url('/desk-wood-boy.png')] [&::before]:brightness-125",
                                cell.isActive &&
                                  assignment?.studentId &&
                                  student &&
                                  student.gender === "F" &&
                                  "[&::before]:bg-[url('/desk-wood-girl.png')] [&::before]:brightness-110",
                                cell.isActive &&
                                  assignment?.studentId &&
                                  student &&
                                  !student.gender &&
                                  "[&::before]:bg-[url('/desk-wood.png')]",
                                cell.isActive && "hover:[&::before]:scale-105",
                                cell.isActive &&
                                  !assignment?.studentId &&
                                  (selectedZoneId
                                    ? `${getZoneHoverClass(
                                        selectedZoneId
                                      )} hover:bg-white/20 hover:border-gray-300`
                                    : "hover:bg-white/20 hover:border-gray-300"),
                                cell.isActive &&
                                  assignment?.studentId &&
                                  student &&
                                  student.gender === "M" &&
                                  "hover:bg-white/20 hover:border-gray-300 relative",
                                cell.isActive &&
                                  assignment?.studentId &&
                                  student &&
                                  student.gender === "F" &&
                                  "hover:bg-white/20 hover:border-gray-300",
                                cell.isActive &&
                                  assignment?.studentId &&
                                  student &&
                                  !student.gender &&
                                  "hover:bg-white/20 hover:border-gray-300",
                                getZoneColorClass(cell.zoneId),
                                isSelected &&
                                  student?.gender === "M" &&
                                  "ring-2 ring-primary ring-offset-1 border-primary",
                                isSelected &&
                                  student?.gender === "F" &&
                                  "ring-2 ring-rose-500 ring-offset-1 border-rose-500",
                                isSelected &&
                                  !student?.gender &&
                                  "ring-2 ring-blue-500 ring-offset-1 border-blue-500",
                                assignment?.isLocked &&
                                  student?.gender === "M" &&
                                  "bg-primary/30 border-primary/50 ring-2 ring-primary/40",
                                assignment?.isLocked &&
                                  student?.gender === "F" &&
                                  "bg-rose-200 border-rose-400 ring-2 ring-rose-300",
                                assignment?.isLocked &&
                                  !student?.gender &&
                                  "bg-sky-200 border-sky-500 ring-2 ring-sky-400"
                              )}
                              onClick={() => handleSeatClick(r, c)}
                            >
                              {cell.isActive && (
                                <div
                                  className="text-center px-2 w-full relative z-[2]"
                                  style={{ transform: "translateY(-12px)" }}
                                >
                                  {assignment?.studentId && student ? (
                                    <div className="flex flex-col h-full relative">
                                      <div
                                        className={`${cellTextSize} font-semibold truncate flex items-center justify-center h-full ${
                                          !student.gender ? "text-white" : ""
                                        }`}
                                      >
                                        {student.attendanceNumber && (
                                          <span
                                            className={`${
                                              isFullscreen
                                                ? "text-lg"
                                                : "text-base"
                                            } font-normal ${
                                              !student.gender ? "text-white/90" : "text-gray-500"
                                            } mr-1`}
                                          >
                                            {student.attendanceNumber}.
                                          </span>
                                        )}
                                        {student.name}
                                      </div>
                                      {!isFullscreen && (
                                        <button
                                          onClick={(e) =>
                                            handleLockToggle(r, c, e)
                                          }
                                          className="absolute p-0.5 hover:bg-gray-200/50 rounded transition-colors"
                                          style={{ top: "-15px", left: "4px" }}
                                          title={
                                            assignment.isLocked
                                              ? "고정 해제"
                                              : "고정"
                                          }
                                        >
                                          <Pin
                                            className={`${cellIconSize} ${
                                              assignment.isLocked
                                                ? "text-gray-700 fill-gray-700"
                                                : "text-gray-400"
                                            }`}
                                          />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      className={`${
                                        isFullscreen ? "text-sm" : "text-xs"
                                      } text-gray-400`}
                                    >
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
            <div
              className={cn(
                "flex gap-12 justify-center mx-auto",
                isAnimating && "animate-pulse"
              )}
              style={{
                marginTop: "60px",
                minHeight: rows < 5 ? `${minContainerHeight}px` : undefined,
              }}
            >
              {Array.from({ length: Math.floor(cols / 2) }).map(
                (_, groupIndex) => {
                  const startCol = groupIndex * 2;

                  return (
                    <div
                      key={groupIndex}
                      className="flex flex-col"
                      style={{
                        width: `${2 * 121}px`,
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
                                const isSelected =
                                  selectedSeat?.r === r &&
                                  selectedSeat?.c === c;

                                if (!cell) return null;

                                return (
                                  <div
                                    key={`${r}-${c}`}
                                    className={cn(
                                      `w-full min-w-[121px] ${cellHeight} flex items-center justify-center border-transparent rounded-lg cursor-pointer transition-all duration-200 relative`,
                                      !cell.isActive &&
                                        "opacity-0 hover:opacity-100 hover:bg-gray-100/50 hover:border-gray-300 hover:border-dashed",
                                      cell.isActive &&
                                        "[&::before]:content-[''] [&::before]:absolute [&::before]:inset-[-14px] [&::before]:bg-cover [&::before]:bg-center [&::before]:bg-no-repeat [&::before]:rounded-lg [&::before]:pointer-events-none [&::before]:z-0 [&::before]:transition-transform [&::before]:duration-200",
                                      cell.isActive &&
                                        !assignment?.studentId &&
                                        "[&::before]:bg-[url('/desk-wood.png')]",
                                      cell.isActive &&
                                        assignment?.studentId &&
                                        student &&
                                        student.gender === "M" &&
                                        "[&::before]:bg-[url('/desk-wood-boy.png')] [&::before]:brightness-125",
                                      cell.isActive &&
                                        assignment?.studentId &&
                                        student &&
                                        student.gender === "F" &&
                                        "[&::before]:bg-[url('/desk-wood-girl.png')] [&::before]:brightness-110",
                                      cell.isActive &&
                                        assignment?.studentId &&
                                        student &&
                                        !student.gender &&
                                        "[&::before]:bg-[url('/desk-wood.png')]",
                                      cell.isActive &&
                                        "hover:[&::before]:scale-105",
                                      cell.isActive &&
                                        !assignment?.studentId &&
                                        (selectedZoneId
                                          ? `${getZoneHoverClass(
                                              selectedZoneId
                                            )} hover:bg-white/20 hover:border-gray-300`
                                          : "hover:bg-white/20 hover:border-gray-300"),
                                      cell.isActive &&
                                        assignment?.studentId &&
                                        student &&
                                        student.gender === "M" &&
                                        "hover:bg-white/20 hover:border-gray-300 relative",
                                      cell.isActive &&
                                        assignment?.studentId &&
                                        student &&
                                        student.gender === "F" &&
                                        "hover:bg-white/20 hover:border-gray-300",
                                      cell.isActive &&
                                        assignment?.studentId &&
                                        student &&
                                        !student.gender &&
                                        "hover:bg-white/20 hover:border-gray-300",
                                      getZoneColorClass(cell.zoneId),
                                      isSelected &&
                                        student?.gender === "M" &&
                                        "ring-2 ring-primary ring-offset-1 border-primary",
                                      isSelected &&
                                        student?.gender === "F" &&
                                        "ring-2 ring-rose-500 ring-offset-1 border-rose-500",
                                      isSelected &&
                                        !student?.gender &&
                                        "ring-2 ring-blue-500 ring-offset-1 border-blue-500",
                                      assignment?.isLocked &&
                                        student?.gender === "M" &&
                                        "bg-primary/30 border-primary/50 ring-2 ring-primary/40",
                                      assignment?.isLocked &&
                                        student?.gender === "F" &&
                                        "bg-rose-200 border-rose-400 ring-2 ring-rose-300",
                                      assignment?.isLocked &&
                                        !student?.gender &&
                                        "bg-sky-200 border-sky-500 ring-2 ring-sky-400"
                                    )}
                                    onClick={() => handleSeatClick(r, c)}
                                  >
                                    {cell.isActive && (
                                      <div
                                        className="text-center px-2 w-full relative z-[2]"
                                        style={{
                                          transform: "translateY(-12px)",
                                        }}
                                      >
                                        {assignment?.studentId && student ? (
                                          <div className="flex flex-col h-full relative">
                                            <div
                                              className={`${cellTextSize} font-semibold truncate flex items-center justify-center h-full ${
                                                !student.gender ? "text-white" : ""
                                              }`}
                                            >
                                              {student.attendanceNumber && (
                                                <span
                                                  className={`${
                                                    isFullscreen
                                                      ? "text-lg"
                                                      : "text-base"
                                                  } font-normal ${
                                                    !student.gender ? "text-white/90" : "text-gray-500"
                                                  } mr-1`}
                                                >
                                                  {student.attendanceNumber}.
                                                </span>
                                              )}
                                              {student.name}
                                            </div>
                                            {!isFullscreen && (
                                              <button
                                                onClick={(e) =>
                                                  handleLockToggle(r, c, e)
                                                }
                                                className="absolute p-0.5 hover:bg-gray-200/50 rounded transition-colors"
                                                style={{
                                                  top: "-15px",
                                                  left: "4px",
                                                }}
                                                title={
                                                  assignment.isLocked
                                                    ? "고정 해제"
                                                    : "고정"
                                                }
                                              >
                                                <Pin
                                                  className={`${cellIconSize} ${
                                                    assignment.isLocked
                                                      ? "text-gray-700 fill-gray-700"
                                                      : "text-gray-400"
                                                  }`}
                                                />
                                              </button>
                                            )}
                                          </div>
                                        ) : (
                                          <div
                                            className={`${
                                              isFullscreen
                                                ? "text-sm"
                                                : "text-xs"
                                            } text-gray-400`}
                                          >
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
              className={cn(
                "grid gap-y-2 gap-x-12 mx-auto",
                isAnimating && "animate-pulse"
              )}
              style={{
                marginTop: "60px",
                gridTemplateColumns: isFullscreen
                  ? `repeat(${cols}, minmax(121px, 1fr))`
                  : `repeat(${cols}, minmax(0, 1fr))`,
                ...(isFullscreen
                  ? { width: "fit-content" }
                  : {
                      maxWidth: `${cols * 121}px`,
                      minHeight:
                        rows < 5 ? `${minContainerHeight}px` : undefined,
                    }),
              }}
            >
              {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                  const cell = getCell(r, c);
                  const assignment = getAssignment(r, c);
                  const student = getStudent(assignment?.studentId || null);
                  const isSelected =
                    selectedSeat?.r === r && selectedSeat?.c === c;

                  if (!cell) return null;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={cn(
                        `${
                          isFullscreen ? "w-[121px]" : "w-full"
                        } ${cellHeight} flex items-center justify-center border-transparent rounded-lg cursor-pointer transition-all duration-200 relative`,
                        !cell.isActive &&
                          "opacity-0 hover:opacity-100 hover:bg-gray-100/50 hover:border-gray-300 hover:border-dashed",
                        cell.isActive &&
                          "[&::before]:content-[''] [&::before]:absolute [&::before]:inset-[-14px] [&::before]:bg-cover [&::before]:bg-center [&::before]:bg-no-repeat [&::before]:rounded-lg [&::before]:pointer-events-none [&::before]:z-0 [&::before]:transition-transform [&::before]:duration-200",
                        cell.isActive &&
                          !assignment?.studentId &&
                          "[&::before]:bg-[url('/desk-wood.png')]",
                        cell.isActive &&
                          assignment?.studentId &&
                          student &&
                          student.gender === "M" &&
                          "[&::before]:bg-[url('/desk-wood-boy.png')] [&::before]:brightness-110",
                        cell.isActive &&
                          assignment?.studentId &&
                          student &&
                          student.gender === "F" &&
                          "[&::before]:bg-[url('/desk-wood-girl.png')] [&::before]:brightness-110",
                        cell.isActive &&
                          assignment?.studentId &&
                          student &&
                          !student.gender &&
                          "[&::before]:bg-[url('/desk-wood.png')]",
                        cell.isActive && "hover:[&::before]:scale-105",
                        cell.isActive &&
                          !assignment?.studentId &&
                          (selectedZoneId
                            ? `${getZoneHoverClass(
                                selectedZoneId
                              )} hover:bg-white/20 hover:border-gray-300`
                            : "hover:bg-white/20 hover:border-gray-300"),
                        cell.isActive &&
                          assignment?.studentId &&
                          student &&
                          student.gender === "M" &&
                          "hover:bg-white/20 hover:border-gray-300 relative",
                        cell.isActive &&
                          assignment?.studentId &&
                          student &&
                          student.gender === "F" &&
                          "hover:bg-white/20 hover:border-gray-300",
                        cell.isActive &&
                          assignment?.studentId &&
                          student &&
                          !student.gender &&
                          "hover:bg-white/20 hover:border-gray-300",
                        // 기본형에서 지정구역 테두리를 ::after로 추가 (책상 이미지 위에 표시)
                        layoutType === "기본형" &&
                          cell.isActive &&
                          cell.zoneId &&
                          "[&::after]:content-[''] [&::after]:absolute [&::after]:inset-0 [&::after]:pointer-events-none [&::after]:z-[1] [&::after]:rounded-lg [&::after]:border-2",
                        layoutType === "기본형" &&
                          cell.isActive &&
                          cell.zoneId &&
                          (() => {
                            const zone = zones.find((z) => z.id === cell.zoneId);
                            if (!zone) return "";
                            const colorMap: Record<string, string> = {
                              lime: "[&::after]:border-lime-400",
                              yellow: "[&::after]:border-yellow-400",
                              rose: "[&::after]:border-rose-400",
                              violet: "[&::after]:border-violet-400",
                              orange: "[&::after]:border-orange-400",
                            };
                            return colorMap[zone.color] || "[&::after]:border-gray-400";
                          })(),
                        // 기본형이 아닐 때는 기존 방식 유지
                        layoutType !== "기본형" && getZoneColorClass(cell.zoneId),
                        isSelected &&
                          student?.gender === "M" &&
                          "ring-2 ring-primary ring-offset-1 border-primary",
                        isSelected &&
                          student?.gender === "F" &&
                          "ring-2 ring-rose-500 ring-offset-1 border-rose-500",
                        isSelected &&
                          !student?.gender &&
                          "ring-2 ring-blue-500 ring-offset-1 border-blue-500",
                        assignment?.isLocked &&
                          student?.gender === "M" &&
                          "bg-primary/30 border-primary/50 ring-2 ring-primary/40",
                        assignment?.isLocked &&
                          student?.gender === "F" &&
                          "bg-rose-200 border-rose-400 ring-2 ring-rose-300",
                        assignment?.isLocked &&
                          !student?.gender &&
                          "bg-sky-200 border-sky-500 ring-2 ring-sky-400"
                      )}
                      onClick={() => handleSeatClick(r, c)}
                    >
                      {cell.isActive && (
                        <div
                          className="text-center px-2 w-full relative z-[2]"
                          style={{ transform: "translateY(-15px)" }}
                        >
                          {assignment?.studentId && student ? (
                            <div className="flex flex-col h-full relative">
                              <div
                                className={`${cellTextSize} font-semibold truncate flex items-center justify-center h-full ${
                                  !student.gender ? "text-white" : ""
                                }`}
                              >
                                {student.attendanceNumber && (
                                  <span
                                    className={`${
                                      isFullscreen ? "text-lg" : "text-base"
                                    } font-normal ${
                                      !student.gender ? "text-white/90" : "text-gray-500"
                                    } mr-1`}
                                  >
                                    {student.attendanceNumber}.
                                  </span>
                                )}
                                {student.name}
                              </div>
                              {!isFullscreen && (
                                <button
                                  onClick={(e) => handleLockToggle(r, c, e)}
                                  className="absolute p-0.5 hover:bg-gray-200/50 rounded transition-colors"
                                  style={{ top: "-15px", left: "7px" }}
                                  title={
                                    assignment.isLocked ? "고정 해제" : "고정"
                                  }
                                >
                                  <Pin
                                    className={`${cellIconSize} ${
                                      assignment.isLocked
                                        ? "text-gray-700 fill-gray-700"
                                        : "text-gray-400"
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`${
                                isFullscreen ? "text-sm" : "text-xs"
                              } text-gray-400`}
                            >
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

      {selectedSeat && (
        <div className="mt-4 text-center text-sm text-gray-600 bg-white/80 px-4 py-2 rounded-lg shadow-sm">
          교환할 좌석을 클릭하세요
        </div>
      )}
    </div>
  );
}
