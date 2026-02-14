"use client";

import { useEffect, useRef, useState } from "react";
import { ClassRoster, Cell, SeatAssignment, Zone } from "@/types";
import ClassroomGrid from "./ClassroomGrid";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FullscreenViewProps {
  rows: number;
  cols: number;
  cells: Cell[];
  assignments: SeatAssignment[];
  selectedRoster: ClassRoster | null;
  zones: Zone[];
  layoutType: "기본형" | "분단형" | "모둠형(4인)";
  onClose: () => void;
}

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenCapableDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

const getFullscreenElement = (doc: FullscreenCapableDocument) =>
  doc.fullscreenElement ??
  doc.webkitFullscreenElement ??
  doc.mozFullScreenElement ??
  doc.msFullscreenElement ??
  null;

const requestFullscreenSafe = async (element: FullscreenCapableElement) => {
  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }
  if (element.webkitRequestFullscreen) {
    await Promise.resolve(element.webkitRequestFullscreen());
    return;
  }
  if (element.mozRequestFullScreen) {
    await Promise.resolve(element.mozRequestFullScreen());
    return;
  }
  if (element.msRequestFullscreen) {
    await Promise.resolve(element.msRequestFullscreen());
  }
};

const exitFullscreenSafe = async (doc: FullscreenCapableDocument) => {
  if (doc.exitFullscreen) {
    await doc.exitFullscreen().catch(() => {});
    return;
  }
  if (doc.webkitExitFullscreen) {
    await Promise.resolve(doc.webkitExitFullscreen());
    return;
  }
  if (doc.mozCancelFullScreen) {
    await Promise.resolve(doc.mozCancelFullScreen());
    return;
  }
  if (doc.msExitFullscreen) {
    await Promise.resolve(doc.msExitFullscreen());
  }
};

export default function FullscreenView({
  rows,
  cols,
  cells,
  assignments,
  selectedRoster,
  zones,
  layoutType,
  onClose,
}: FullscreenViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !gridRef.current) return;

      const container = containerRef.current;
      const grid = gridRef.current;

      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 측정
      setTimeout(() => {
        const containerWidth = container.clientWidth - 128; // padding 고려 (양쪽 64px)
        const containerHeight = container.clientHeight - 128;
        
        const gridWidth = grid.scrollWidth;
        const gridHeight = grid.scrollHeight;

        if (gridWidth === 0 || gridHeight === 0) return;

        const scaleX = containerWidth / gridWidth;
        const scaleY = containerHeight / gridHeight;
        
        // 비율을 유지하면서 화면에 맞게 조정 (최소 0.5, 최대 3)
        const newScale = Math.max(0.5, Math.min(scaleX, scaleY, 3));
        setScale(newScale);
      }, 100);
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", updateScale);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [rows, cols, cells, assignments]);

  useEffect(() => {
    // 브라우저 전체화면 API 사용 시도
    const enterFullscreen = async () => {
      const element = containerRef.current;
      if (!element) return;

      try {
        await requestFullscreenSafe(element as FullscreenCapableElement);
      } catch (error) {
        console.log("전체화면 모드 진입 실패:", error);
      }
    };

    enterFullscreen();

    // 전체화면 종료 이벤트 리스너 (ESC 키 등으로 종료될 때)
    const handleFullscreenChange = () => {
      const isFullscreen = getFullscreenElement(
        document as FullscreenCapableDocument
      );

      if (!isFullscreen) {
        // 전체화면이 해제되면 자동으로 닫기
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      // 이벤트 리스너 제거
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      // 전체화면 모드 종료 (전체화면 상태 확인 후)
      const fullscreenDocument = document as FullscreenCapableDocument;
      const isFullscreen = getFullscreenElement(fullscreenDocument);

      if (isFullscreen) {
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as FullscreenCapableDocument).webkitExitFullscreen) {
            (document as FullscreenCapableDocument).webkitExitFullscreen?.();
          } else if ((document as FullscreenCapableDocument).mozCancelFullScreen) {
            (document as FullscreenCapableDocument).mozCancelFullScreen?.();
          } else if ((document as FullscreenCapableDocument).msExitFullscreen) {
            (document as FullscreenCapableDocument).msExitFullscreen?.();
          }
        } catch {
          // 전체화면 종료 실패는 무시
        }
      }
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-white" 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      <div className="absolute top-4 right-4 z-10">
        <Button 
          onClick={() => {
            // 전체화면 모드 종료
            const fullscreenDocument = document as FullscreenCapableDocument;
            const isFullscreen = getFullscreenElement(fullscreenDocument);

            if (isFullscreen) {
              void exitFullscreenSafe(fullscreenDocument);
            }
            onClose();
          }} 
          variant="outline" 
          size="icon"
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          padding: '64px',
          boxSizing: 'border-box',
        }}
      >
        <div
          ref={gridRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.3s ease-out",
            width: 'fit-content',
            height: 'fit-content',
          }}
        >
          <ClassroomGrid
            rows={rows}
            cols={cols}
            cells={cells}
            assignments={assignments}
            selectedRoster={selectedRoster}
            zones={zones}
            layoutType={layoutType}
            selectedZoneId={null}
            onCellClick={() => {}} // 전체화면에서는 클릭 비활성화
            isAnimating={false}
            onAssignmentChange={() => {}} // 전체화면에서는 변경 불가
            isFullscreen={true}
          />
        </div>
      </div>
    </div>
  );
}
