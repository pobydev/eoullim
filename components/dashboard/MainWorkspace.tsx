"use client";

import { useState, useEffect, useRef } from "react";
import {
  ClassRoster,
  Layout,
  Cell,
  SeatAssignment,
  LayoutConfig,
  Zone,
  ZoneStudentMapping,
  ZONE_COLORS,
} from "@/types";
import ClassroomGrid from "./ClassroomGrid";
import StudentList from "./StudentList";
import LayoutControls from "./LayoutControls";
import ZoneStudentAssignmentDialog from "./ZoneStudentAssignmentDialog";
import FullscreenView from "./FullscreenView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  Save,
  Printer,
  RotateCcw,
  Maximize2,
  X,
  ClipboardList,
  GraduationCap,
  Users,
  School,
  ArrowLeft,
  Bell,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import PrintView from "./PrintView";
import { useAuth } from "@/lib/auth";
import { saveLayout } from "@/lib/firestore";
import { generateLayout, shuffleArray } from "@/lib/layout-algorithm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface MainWorkspaceProps {
  selectedRoster: ClassRoster | null;
  selectedLayout: Layout | null;
  onSelectLayout: (layout: Layout | null) => void;
  onRosterUpdate: (roster: ClassRoster) => void;
  onSelectRoster: (roster: ClassRoster | null) => void;
  assignments: SeatAssignment[];
  onAssignmentsChange: (assignments: SeatAssignment[]) => void;
  onLayoutSaved?: () => void;
  onAnimatingChange?: (isAnimating: boolean) => void;
}

export default function MainWorkspace({
  selectedRoster,
  selectedLayout,
  onSelectLayout,
  onRosterUpdate,
  onSelectRoster,
  assignments,
  onAssignmentsChange,
  onLayoutSaved,
  onAnimatingChange,
}: MainWorkspaceProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(5);
  const [layoutType, setLayoutType] = useState<
    "기본형" | "분단형" | "모둠형(4인)"
  >("기본형");
  const [cells, setCells] = useState<Cell[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneStudentMapping, setZoneStudentMapping] = useState<
    ZoneStudentMapping[]
  >([]);
  const [genderOption, setGenderOption] = useState<
    "남녀 짝" | "동성 짝" | "랜덤"
  >("랜덤");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printViewMode, setPrintViewMode] = useState<"teacher" | "student">(
    "teacher"
  );
  const [skipGridInit, setSkipGridInit] = useState(false);
  const [showFullscreenView, setShowFullscreenView] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [layoutTitle, setLayoutTitle] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<
    SeatAssignment[] | null
  >(null);
  const [enableCountdown, setEnableCountdown] = useState(false);
  const [enableSequentialAnimation, setEnableSequentialAnimation] =
    useState(false);
  const [sequentialAssignments, setSequentialAssignments] = useState<
    SeatAssignment[]
  >([]);
  const [currentSequentialIndex, setCurrentSequentialIndex] = useState(0);
  const [enableWaveAnimation, setEnableWaveAnimation] = useState(false);
  const [waveAssignments, setWaveAssignments] = useState<SeatAssignment[][]>(
    []
  );
  const [currentWaveRow, setCurrentWaveRow] = useState(0);
  const sequentialAudioRef = useRef<HTMLAudioElement | null>(null);
  const waveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!skipGridInit) {
      initializeGrid();
    } else {
      setSkipGridInit(false);
    }
  }, [rows, cols]);

  // isAnimating 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onAnimatingChange) {
      onAnimatingChange(isAnimating);
    }
  }, [isAnimating, onAnimatingChange]);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    // 효과음 재생 (각 카운트마다)
    try {
      const audio = new Audio("/sounds/bell-countdown.wav");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // 효과음 파일이 없어도 에러 무시
      });
    } catch (error) {
      // 효과음 재생 실패 무시
    }

    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        // 카운트다운 종료 - 결과 공개
        setCountdown(null);
        setShowCountdown(false);
        if (pendingAssignments) {
          onAssignmentsChange(pendingAssignments);
          setPendingAssignments(null);
        }
        setIsAnimating(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, pendingAssignments, onAssignmentsChange]);

  // 순차 배치 효과음 관리 - 시작/종료 시점에만 제어
  useEffect(() => {
    // 순차 배치가 시작될 때 효과음 재생
    if (
      enableSequentialAnimation &&
      sequentialAssignments.length > 0 &&
      !sequentialAudioRef.current
    ) {
      try {
        const audio = new Audio("/sounds/sequential-loop.mp3");
        audio.loop = true;
        audio.volume = 0.4;
        sequentialAudioRef.current = audio;

        audio.play().catch((error) => {
          // 효과음 재생 실패 무시
        });
      } catch (error) {
        // 효과음 초기화 실패 무시
        sequentialAudioRef.current = null;
      }
    }

    // 순차 배치가 종료되거나 비활성화될 때 효과음 정지
    if (
      (!enableSequentialAnimation || sequentialAssignments.length === 0) &&
      sequentialAudioRef.current
    ) {
      sequentialAudioRef.current.pause();
      sequentialAudioRef.current.currentTime = 0;
      sequentialAudioRef.current = null;
    }
  }, [enableSequentialAnimation, sequentialAssignments.length]);

  // 파도 배치 효과음 관리 - 시작/종료 시점에만 제어
  useEffect(() => {
    // 파도 배치가 시작될 때 효과음 재생
    if (
      enableWaveAnimation &&
      waveAssignments.length > 0 &&
      !waveAudioRef.current
    ) {
      try {
        const audio = new Audio("/sounds/wave-loop.mp3");
        audio.loop = true;
        audio.volume = 0.4;
        waveAudioRef.current = audio;

        audio.play().catch((error) => {
          // 효과음 재생 실패 무시
        });
      } catch (error) {
        // 효과음 초기화 실패 무시
        waveAudioRef.current = null;
      }
    }

    // 파도 배치가 종료되거나 비활성화될 때 효과음 정지
    if (
      (!enableWaveAnimation || waveAssignments.length === 0) &&
      waveAudioRef.current
    ) {
      waveAudioRef.current.pause();
      waveAudioRef.current.currentTime = 0;
      waveAudioRef.current = null;
    }
  }, [enableWaveAnimation, waveAssignments.length]);

  // 순차 배치 애니메이션
  useEffect(() => {
    if (!enableSequentialAnimation || sequentialAssignments.length === 0) {
      return;
    }

    if (currentSequentialIndex >= sequentialAssignments.length) {
      // 모든 배치 완료
      setIsAnimating(false);
      setSequentialAssignments([]);
      setCurrentSequentialIndex(0);
      return;
    }

    // 학생 수에 따라 딜레이 조정 (최적화)
    const studentCount = sequentialAssignments.length;
    const baseDelay = studentCount > 30 ? 10 : 20;
    const maxDelay = studentCount > 30 ? 50 : 100;
    const delay = baseDelay + Math.random() * (maxDelay - baseDelay);

    const timer = setTimeout(() => {
      const currentAssignment = sequentialAssignments[currentSequentialIndex];
      onAssignmentsChange(
        assignments.map((a) =>
          a.seat.r === currentAssignment.seat.r &&
          a.seat.c === currentAssignment.seat.c
            ? currentAssignment
            : a
        )
      );
      setCurrentSequentialIndex((prev) => prev + 1);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [
    currentSequentialIndex,
    sequentialAssignments,
    enableSequentialAnimation,
    onAssignmentsChange,
    assignments,
  ]);

  // 파도 배치 애니메이션 (행 단위로 순차 배치)
  useEffect(() => {
    if (!enableWaveAnimation || waveAssignments.length === 0) return;
    if (currentWaveRow >= waveAssignments.length) {
      // 모든 행 배치 완료
      setIsAnimating(false);
      setWaveAssignments([]);
      setCurrentWaveRow(0);
      return;
    }

    // 행별 배치 딜레이 (100ms ~ 200ms)
    const delay = 100 + Math.random() * 100;

    const timer = setTimeout(() => {
      const currentRowAssignments = waveAssignments[currentWaveRow];
      // 현재 행의 모든 자리를 한 번에 배치
      onAssignmentsChange(
        assignments.map((a) => {
          const rowAssignment = currentRowAssignments.find(
            (wa) => wa.seat.r === a.seat.r && wa.seat.c === a.seat.c
          );
          return rowAssignment || a;
        })
      );
      setCurrentWaveRow((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    currentWaveRow,
    waveAssignments,
    enableWaveAnimation,
    onAssignmentsChange,
    assignments,
  ]);

  useEffect(() => {
    if (selectedLayout) {
      setRows(selectedLayout.config.rows);
      setCols(selectedLayout.config.cols);
      setLayoutType(selectedLayout.config.layoutType || "기본형");
      setCells(selectedLayout.cells);
      onAssignmentsChange(selectedLayout.currentAssignment);
      setGenderOption(selectedLayout.config.genderOption || "랜덤");
      setZones(selectedLayout.config.zones || []);
      if (selectedLayout.zoneStudentMapping) {
        setZoneStudentMapping(selectedLayout.zoneStudentMapping);
      }
    } else {
      initializeGrid();
      setLayoutType("기본형");
      setZones([]);
      setZoneStudentMapping([]);
    }
  }, [selectedLayout]);

  // zones가 변경될 때 존재하지 않는 zoneId를 가진 좌석 및 매핑 정리
  useEffect(() => {
    const validZoneIds = new Set(zones.map((z) => z.id));

    // 존재하지 않는 zoneId를 가진 좌석 정리
    setCells((prevCells) =>
      prevCells.map((cell) => {
        if (cell.zoneId && !validZoneIds.has(cell.zoneId)) {
          // 존재하지 않는 zoneId를 가진 좌석은 zoneId를 null로 변경
          return { ...cell, zoneId: null };
        }
        return cell;
      })
    );

    // 존재하지 않는 zoneId를 가진 매핑 정리
    setZoneStudentMapping((prevMapping) =>
      prevMapping.filter((mapping) => validZoneIds.has(mapping.zoneId))
    );
  }, [zones]);

  const initializeGrid = () => {
    const newCells: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newCells.push({
          r,
          c,
          isActive: true,
          zoneId: null,
        });
      }
    }
    setCells(newCells);
    onAssignmentsChange(
      newCells.map((cell) => ({
        seat: { r: cell.r, c: cell.c },
        studentId: null,
        isLocked: false,
      }))
    );
  };

  const handleCellClick = (r: number, c: number) => {
    if (selectedZoneId) {
      // 지정구역 할당 모드: 클릭한 좌석을 선택된 지정구역에 할당/해제
      setCells(
        cells.map((cell) =>
          cell.r === r && cell.c === c
            ? {
                ...cell,
                zoneId: cell.zoneId === selectedZoneId ? null : selectedZoneId,
              }
            : cell
        )
      );
    } else {
      // 일반 모드: 좌석 활성화/비활성화
      // 단, 지정구역이 할당된 좌석은 비활성화할 수 없음
      const clickedCell = cells.find((cell) => cell.r === r && cell.c === c);
      if (clickedCell?.zoneId) {
        // 지정구역이 할당된 좌석은 비활성화 불가
        return;
      }

      setCells(
        cells.map((cell) =>
          cell.r === r && cell.c === c
            ? { ...cell, isActive: !cell.isActive }
            : cell
        )
      );
      onAssignmentsChange(
        assignments.map((assignment) =>
          assignment.seat.r === r && assignment.seat.c === c
            ? { ...assignment, studentId: null }
            : assignment
        )
      );
    }
  };

  const handleStartAssignment = async () => {
    if (!selectedRoster) {
      setAlertMessage("학급을 먼저 선택해주세요.");
      return;
    }

    const activeCells = cells.filter((cell) => cell.isActive);

    // 기본 유효성 검사
    if (selectedRoster.students.length > activeCells.length) {
      setAlertMessage("자리가 부족합니다! 책상을 더 활성화해주세요.");
      return;
    }

    // 배치 결과 생성
    const newAssignments = generateLayout(
      cells,
      selectedRoster.students,
      zones,
      zoneStudentMapping,
      layoutType === "분단형" ? genderOption : undefined,
      assignments
    );

    if (enableCountdown) {
      // 카운트다운 사용
      setPendingAssignments(newAssignments);
      setShowCountdown(true);
      setCountdown(3);
      setIsAnimating(true);
    } else if (enableSequentialAnimation) {
      // 순차 배치 효과 - 배치 순서를 랜덤으로 섞기
      setIsAnimating(true);
      const shuffledAssignments = shuffleArray([...newAssignments]);
      setSequentialAssignments(shuffledAssignments);
      setCurrentSequentialIndex(0);
      // 빈 assignments로 시작
      const emptyAssignments = newAssignments.map((a) => ({
        ...a,
        studentId: null,
      }));
      onAssignmentsChange(emptyAssignments);
    } else if (enableWaveAnimation) {
      // 파도 배치 효과 - 행별로 순차 배치
      setIsAnimating(true);
      // 행별로 그룹화
      const assignmentsByRow: SeatAssignment[][] = [];
      const maxRow = Math.max(...newAssignments.map((a) => a.seat.r));
      for (let r = 0; r <= maxRow; r++) {
        const rowAssignments = newAssignments.filter(
          (a) => a.seat.r === r && a.studentId !== null
        );
        if (rowAssignments.length > 0) {
          assignmentsByRow.push(rowAssignments);
        }
      }
      setWaveAssignments(assignmentsByRow);
      setCurrentWaveRow(0);
      // 빈 assignments로 시작
      const emptyAssignments = newAssignments.map((a) => ({
        ...a,
        studentId: null,
      }));
      onAssignmentsChange(emptyAssignments);
    } else {
      // 바로 배치 - 효과음 재생
      try {
        const audio = new Audio("/sounds/assignment-complete.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
          // 효과음 재생 실패 무시
        });
      } catch (error) {
        // 효과음 재생 실패 무시
      }
      onAssignmentsChange(newAssignments);
      setIsAnimating(false);
    }
  };

  const performAssignment = () => {
    if (!selectedRoster) return;

    setIsAnimating(true);
    setTimeout(() => {
      const newAssignments = generateLayout(
        cells,
        selectedRoster!.students,
        zones,
        zoneStudentMapping,
        genderOption,
        assignments
      );
      onAssignmentsChange(newAssignments);
      setIsAnimating(false);
    }, 500);
  };

  const handleResetAssignments = () => {
    if (confirm("모든 자리 배정을 초기화하시겠습니까?")) {
      const resetAssignments = cells
        .filter((cell) => cell.isActive)
        .map((cell) => ({
          seat: { r: cell.r, c: cell.c },
          studentId: null,
          isLocked: false,
        }));
      onAssignmentsChange(resetAssignments);
    }
  };

  const handleSaveClick = () => {
    if (!user || !selectedRoster) return;
    // 기본값으로 학급명 + 배치 설정
    const defaultTitle = `${selectedRoster.className} 배치`;
    setLayoutTitle(defaultTitle);
    setShowSaveDialog(true);
  };

  const handleSaveLayout = async () => {
    if (!user || !selectedRoster) return;
    if (!layoutTitle.trim()) {
      alert("배치 이름을 입력해주세요.");
      return;
    }

    const layout: Layout = {
      id: `layout-${Date.now()}`,
      title: layoutTitle.trim(),
      classId: selectedRoster.id,
      config: {
        rows,
        cols,
        layoutType,
        genderOption,
        zones,
      },
      cells,
      currentAssignment: assignments,
      zoneStudentMapping:
        zoneStudentMapping.length > 0 ? zoneStudentMapping : undefined,
    };

    try {
      await saveLayout(user.uid, layout);
      setShowSaveDialog(false);
      setLayoutTitle("");
      alert("자리표가 저장되었습니다.");
      onSelectLayout(layout);
      // 레이아웃 목록 새로고침
      if (onLayoutSaved) {
        onLayoutSaved();
      }
    } catch (error) {
      console.error("자리표 저장 실패:", error);
      alert("자리표 저장에 실패했습니다.");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 shadow-sm shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-3">
            {selectedRoster ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg shadow-md">
                  <GraduationCap className="h-5 w-5" />
                  <h2 className="text-xl font-bold">
                    {selectedRoster.className}
                  </h2>
                </div>
                {selectedRoster.students &&
                  selectedRoster.students.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">
                        {selectedRoster.students.length}명
                      </span>
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 italic">
                <ClipboardList className="h-5 w-5" />
                <h2 className="text-lg font-medium">학급을 선택하세요</h2>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFullscreenView(true)}
              variant="outline"
              disabled={!selectedRoster || assignments.length === 0}
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              자리 확대
            </Button>
            <Button onClick={() => setShowPrintView(true)} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              인쇄
            </Button>
            <Button onClick={handleSaveClick} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              저장
            </Button>
            <Button
              onClick={handleResetAssignments}
              variant="outline"
              disabled={!selectedRoster || isAnimating}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              초기화
            </Button>
            <Button
              onClick={handleStartAssignment}
              disabled={!selectedRoster || isAnimating}
            >
              <Play className="mr-2 h-4 w-4" />
              배치 시작
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 relative">
          {/* 카운트다운 모달 - 배치표 영역에만 표시 */}
          {showCountdown && countdown !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-8">
                <Bell
                  className="h-32 w-32 text-yellow-400 drop-shadow-lg"
                  style={{
                    animation: "rotateY 1s ease-in-out infinite",
                    transformStyle: "preserve-3d",
                  }}
                />
                <div className="text-9xl font-bold text-white drop-shadow-2xl animate-pulse">
                  {countdown}
                </div>
              </div>
            </div>
          )}
          {!selectedRoster ? (
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-8 bg-white/80 rounded-full shadow-lg backdrop-blur-sm">
                <School className="h-20 w-20 text-sky-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-gray-600">
                  학급을 선택하세요
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  좌측 사이드바에서 학급을 선택하면
                  <br />
                  자리 배치를 시작할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sky-400">
                <ArrowLeft className="h-6 w-6 animate-pulse" />
                <span className="text-sm font-medium">
                  사이드바에서 학급 선택
                </span>
              </div>
            </div>
          ) : (
            <ClassroomGrid
              rows={rows}
              cols={cols}
              cells={cells}
              assignments={assignments}
              selectedRoster={selectedRoster}
              zones={zones}
              layoutType={layoutType}
              selectedZoneId={selectedZoneId}
              onCellClick={handleCellClick}
              isAnimating={isAnimating}
              onAssignmentChange={onAssignmentsChange}
            />
          )}
        </div>

        <div className="w-80 bg-gradient-to-br from-sky-50 via-white to-blue-50 border-l border-gray-200 overflow-y-auto shadow-sm shadow-[-2px_0_4px_rgba(0,0,0,0.08)]">
          <LayoutControls
            rows={rows}
            cols={cols}
            onRowsChange={setRows}
            onColsChange={setCols}
            layoutType={layoutType}
            onLayoutTypeChange={setLayoutType}
            zones={zones}
            onZonesChange={setZones}
            selectedZoneId={selectedZoneId}
            onZoneSelect={setSelectedZoneId}
            genderOption={genderOption}
            onGenderOptionChange={setGenderOption}
            selectedRoster={selectedRoster}
            cells={cells}
            onCellsChange={(newCells) => {
              setCells(newCells);
              setSkipGridInit(true); // 다음 useEffect에서 initializeGrid를 건너뛰도록 설정
              // 셀이 변경되면 배정도 초기화
              onAssignmentsChange(
                newCells.map((cell) => ({
                  seat: { r: cell.r, c: cell.c },
                  studentId: null,
                  isLocked: false,
                }))
              );
            }}
            zoneStudentMapping={zoneStudentMapping}
            onZoneStudentMappingChange={setZoneStudentMapping}
            enableCountdown={enableCountdown}
            onEnableCountdownChange={setEnableCountdown}
            enableSequentialAnimation={enableSequentialAnimation}
            onEnableSequentialAnimationChange={setEnableSequentialAnimation}
            enableWaveAnimation={enableWaveAnimation}
            onEnableWaveAnimationChange={setEnableWaveAnimation}
          />
        </div>
      </div>

      <AlertDialog
        open={!!alertMessage}
        onOpenChange={() => setAlertMessage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>알림</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertMessage(null)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>자리표 저장</DialogTitle>
            <DialogDescription>
              저장할 자리표의 이름을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="layout-title">배치 이름</Label>
              <Input
                id="layout-title"
                placeholder="예: 1학기 중간고사 배치"
                value={layoutTitle}
                onChange={(e) => setLayoutTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveLayout();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSaveLayout} disabled={!layoutTitle.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPrintView && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="p-4 border-b print:hidden">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={printViewMode === "teacher" ? "default" : "outline"}
                  onClick={() => setPrintViewMode("teacher")}
                >
                  교사용 보기
                </Button>
                <Button
                  variant={printViewMode === "student" ? "default" : "outline"}
                  onClick={() => setPrintViewMode("student")}
                >
                  학생용 보기
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowPrintView(false)}>
                닫기
              </Button>
            </div>
          </div>
          <PrintView
            rows={rows}
            cols={cols}
            cells={cells}
            assignments={assignments}
            selectedRoster={selectedRoster}
            zones={zones}
            layoutType={layoutType}
            viewMode={printViewMode}
          />
        </div>
      )}

      {showFullscreenView && (
        <FullscreenView
          rows={rows}
          cols={cols}
          cells={cells}
          assignments={assignments}
          selectedRoster={selectedRoster}
          zones={zones}
          layoutType={layoutType}
          onClose={() => setShowFullscreenView(false)}
        />
      )}
    </div>
  );
}
