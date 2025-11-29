"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Zone,
  ZONE_COLORS,
  ClassRoster,
  Cell,
  ZoneStudentMapping,
} from "@/types";
import { Plus, Trash2, MapPin, Users } from "lucide-react";
import ZoneStudentAssignmentDialog from "./ZoneStudentAssignmentDialog";

interface LayoutControlsProps {
  rows: number;
  cols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  layoutType: "기본형" | "분단형" | "모둠형(4인)";
  onLayoutTypeChange: (type: "기본형" | "분단형" | "모둠형(4인)") => void;
  zones: Zone[];
  onZonesChange: (zones: Zone[]) => void;
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string | null) => void;
  genderOption: "남녀 짝" | "동성 짝" | "랜덤";
  onGenderOptionChange: (option: "남녀 짝" | "동성 짝" | "랜덤") => void;
  selectedRoster: ClassRoster | null;
  cells: Cell[];
  onCellsChange?: (cells: Cell[]) => void;
  zoneStudentMapping: ZoneStudentMapping[];
  onZoneStudentMappingChange: (mapping: ZoneStudentMapping[]) => void;
  enableCountdown: boolean;
  onEnableCountdownChange: (enabled: boolean) => void;
  enableSequentialAnimation: boolean;
  onEnableSequentialAnimationChange: (enabled: boolean) => void;
  enableWaveAnimation: boolean;
  onEnableWaveAnimationChange: (enabled: boolean) => void;
}

export default function LayoutControls({
  rows,
  cols,
  onRowsChange,
  onColsChange,
  layoutType,
  onLayoutTypeChange,
  zones,
  onZonesChange,
  selectedZoneId,
  onZoneSelect,
  genderOption,
  onGenderOptionChange,
  selectedRoster,
  cells,
  onCellsChange,
  zoneStudentMapping,
  onZoneStudentMappingChange,
  enableCountdown,
  onEnableCountdownChange,
  enableSequentialAnimation,
  onEnableSequentialAnimationChange,
  enableWaveAnimation,
  onEnableWaveAnimationChange,
}: LayoutControlsProps) {
  const [isAddZoneDialogOpen, setIsAddZoneDialogOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [showStudentAssignmentDialog, setShowStudentAssignmentDialog] =
    useState(false);

  const applyPreset = (preset: "5x6" | "6x5" | "3분단" | "모둠(4인기준)") => {
    if (preset === "5x6") {
      onRowsChange(6);
      onColsChange(5);
      onLayoutTypeChange("기본형");
    } else if (preset === "6x5") {
      onRowsChange(5);
      onColsChange(6);
      onLayoutTypeChange("기본형");
    } else if (preset === "3분단") {
      onRowsChange(6);
      onColsChange(6);
      onLayoutTypeChange("분단형");
    } else if (preset === "모둠(4인기준)") {
      // 모둠형(4인) 배치: 6열 6행
      onRowsChange(6);
      onColsChange(6);
      onLayoutTypeChange("모둠형(4인)");

      // 셀 생성 (모두 활성화)
      if (onCellsChange) {
        const newCells: Cell[] = [];
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 6; c++) {
            newCells.push({
              r,
              c,
              isActive: true,
              zoneId: null,
            });
          }
        }
        onCellsChange(newCells);
      }
    }
  };

  const handleAddZone = () => {
    if (!newZoneName.trim()) return;

    // 최대 5개까지만 지정구역 추가 가능
    if (zones.length >= 5) {
      alert("지정구역은 최대 5개까지만 추가할 수 있습니다.");
      return;
    }

    const colorIndex = zones.length % ZONE_COLORS.length;
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: newZoneName.trim(),
      color: ZONE_COLORS[colorIndex],
    };

    onZonesChange([...zones, newZone]);
    setNewZoneName("");
    setIsAddZoneDialogOpen(false);
  };

  const handleDeleteZone = (zoneId: string) => {
    if (
      confirm(
        "정말 이 지정구역을 삭제하시겠습니까? 해당 구역에 할당된 좌석도 해제됩니다."
      )
    ) {
      onZonesChange(zones.filter((z) => z.id !== zoneId));
      if (selectedZoneId === zoneId) {
        onZoneSelect(null);
      }
    }
  };

  const handleZoneSelect = (zoneId: string) => {
    if (selectedZoneId === zoneId) {
      onZoneSelect(null);
    } else {
      onZoneSelect(zoneId);
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      lime: "bg-lime-400 border-lime-500",
      yellow: "bg-yellow-400 border-yellow-500",
      rose: "bg-rose-400 border-rose-500",
      violet: "bg-violet-400 border-violet-500",
      orange: "bg-orange-400 border-orange-500",
    };
    return colorMap[color] || "bg-gray-400 border-gray-500";
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">자리 배치 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 배치 형태 선택 */}
          <div className="space-y-2">
            <Label>배치 형태</Label>
            <Select
              value={layoutType}
              onValueChange={(value: "기본형" | "분단형" | "모둠형(4인)") => {
                onLayoutTypeChange(value);
                if (value === "분단형") {
                  // 분단형으로 변경 시 열 수를 분단 수 × 2로 계산 (기존 분단 수 유지)
                  const currentGroups = Math.floor(cols / 2) || 3;
                  onColsChange(currentGroups * 2);
                } else if (value === "모둠형(4인)") {
                  // 모둠형(4인): 자동으로 6열 × 6행 설정, 모두 활성화
                  onRowsChange(6);
                  onColsChange(6);
                  
                  // 셀 생성 (모두 활성화)
                  if (onCellsChange) {
                    const newCells: Cell[] = [];
                    for (let r = 0; r < 6; r++) {
                      for (let c = 0; c < 6; c++) {
                        newCells.push({
                          r,
                          c,
                          isActive: true,
                          zoneId: null,
                        });
                      }
                    }
                    onCellsChange(newCells);
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="기본형">기본형</SelectItem>
                <SelectItem value="분단형">분단형</SelectItem>
                <SelectItem value="모둠형(4인)">모둠형(4인)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 조건부 입력 필드 */}
          {layoutType === "기본형" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cols">열</Label>
                <Input
                  id="cols"
                  type="number"
                  min="1"
                  max="7"
                  value={cols}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const colsValue = parseInt(inputValue) || 1;
                    const clampedCols = Math.min(Math.max(colsValue, 1), 7);
                    onColsChange(clampedCols);
                  }}
                  onBlur={(e) => {
                    const colsValue = parseInt(e.target.value) || 1;
                    const clampedCols = Math.min(Math.max(colsValue, 1), 7);
                    if (colsValue !== clampedCols) {
                      onColsChange(clampedCols);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rows">행</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="7"
                  value={rows}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const rowsValue = parseInt(inputValue) || 1;
                    const clampedRows = Math.min(Math.max(rowsValue, 1), 7);
                    onRowsChange(clampedRows);
                  }}
                  onBlur={(e) => {
                    const rowsValue = parseInt(e.target.value) || 1;
                    const clampedRows = Math.min(Math.max(rowsValue, 1), 7);
                    if (rowsValue !== clampedRows) {
                      onRowsChange(clampedRows);
                    }
                  }}
                />
              </div>
            </div>
          ) : layoutType === "모둠형(4인)" ? (
            <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium mb-1">4인 모둠 배치 (6열 × 6행)</p>
              <p className="text-xs text-gray-500">
                자리를 클릭하여 비활성화하여 모둠 구조를 조정할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groups">분단 수</Label>
                <Input
                  id="groups"
                  type="number"
                  min="1"
                  max="4"
                  value={Math.floor(cols / 2) || 3}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const groups = parseInt(inputValue) || 1;
                    // 최대 4분단까지만 허용
                    const clampedGroups = Math.min(Math.max(groups, 1), 4);
                    onColsChange(clampedGroups * 2); // 분단 수 × 2 = 열 수
                  }}
                  onBlur={(e) => {
                    // 포커스를 잃을 때도 값 검증
                    const groups = parseInt(e.target.value) || 1;
                    const clampedGroups = Math.min(Math.max(groups, 1), 4);
                    if (groups !== clampedGroups) {
                      onColsChange(clampedGroups * 2);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rows">행</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="8"
                  value={rows}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const rowsValue = parseInt(inputValue) || 1;
                    const clampedRows = Math.min(Math.max(rowsValue, 1), 8);
                    onRowsChange(clampedRows);
                  }}
                  onBlur={(e) => {
                    const rowsValue = parseInt(e.target.value) || 1;
                    const clampedRows = Math.min(Math.max(rowsValue, 1), 8);
                    if (rowsValue !== clampedRows) {
                      onRowsChange(clampedRows);
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>자주 쓰는 배치</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("5x6")}
              >
                5×6
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("6x5")}
              >
                6×5
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("3분단")}
              >
                3분단
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("모둠(4인기준)")}
              >
                모둠(4인기준)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">지정구역 관리</CardTitle>
            <div className="flex items-center gap-1">
              {zones.length > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    if (!selectedRoster) {
                      alert("먼저 학급을 선택해주세요.");
                      return;
                    }
                    setShowStudentAssignmentDialog(true);
                  }}
                  className="px-2 text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  배정
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (zones.length >= 5) {
                    alert("지정구역은 최대 5개까지만 추가할 수 있습니다.");
                    return;
                  }
                  setIsAddZoneDialogOpen(true);
                }}
                disabled={zones.length >= 5}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {zones.length === 0 ? (
            <div className="text-center text-gray-500 py-4 text-sm">
              지정구역이 없습니다. 추가해주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-4 h-4 rounded border-2 ${getColorClass(
                        zone.color
                      )}`}
                    />
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={
                        selectedZoneId === zone.id ? "default" : "outline"
                      }
                      onClick={() => handleZoneSelect(zone.id)}
                      className="h-7 px-2 text-xs"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedZoneId === zone.id ? "할당 중" : "좌석 할당"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteZone(zone.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddZoneDialogOpen} onOpenChange={setIsAddZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>지정구역 추가</DialogTitle>
            <DialogDescription>
              새로운 지정구역의 이름을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="zone-name">구역 이름</Label>
            <Input
              id="zone-name"
              placeholder="예: 앞자리, 뒷자리, 시력보호"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddZone();
                }
              }}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddZoneDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleAddZone} disabled={!newZoneName.trim()}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">성별 배치 옵션</CardTitle>
        </CardHeader>
        <CardContent>
          {layoutType === "분단형" ? (
            <Select
              value={genderOption}
              onValueChange={(value: "남녀 짝" | "동성 짝" | "랜덤") =>
                onGenderOptionChange(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="랜덤">랜덤</SelectItem>
                <SelectItem value="남녀 짝">남녀 짝</SelectItem>
                <SelectItem value="동성 짝">동성 짝</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">
              분단형 배치에서만 사용할 수 있습니다.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">배치 효과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={enableCountdown ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (enableCountdown) {
                  onEnableCountdownChange(false);
                } else {
                  onEnableCountdownChange(true);
                  onEnableSequentialAnimationChange(false);
                  onEnableWaveAnimationChange(false);
                }
              }}
            >
              카운트다운
            </Button>
            <Button
              variant={enableSequentialAnimation ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (enableSequentialAnimation) {
                  onEnableSequentialAnimationChange(false);
                } else {
                  onEnableSequentialAnimationChange(true);
                  onEnableCountdownChange(false);
                  onEnableWaveAnimationChange(false);
                }
              }}
            >
              순차 배치
            </Button>
            <Button
              variant={enableWaveAnimation ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (enableWaveAnimation) {
                  onEnableWaveAnimationChange(false);
                } else {
                  onEnableWaveAnimationChange(true);
                  onEnableCountdownChange(false);
                  onEnableSequentialAnimationChange(false);
                }
              }}
            >
              파도 배치
            </Button>
          </div>
        </CardContent>
      </Card>

      <ZoneStudentAssignmentDialog
        open={showStudentAssignmentDialog}
        onOpenChange={setShowStudentAssignmentDialog}
        zones={zones}
        students={selectedRoster?.students || []}
        cells={cells}
        zoneStudentMapping={zoneStudentMapping}
        onConfirm={(mapping) => {
          onZoneStudentMappingChange(mapping);
          setShowStudentAssignmentDialog(false);
        }}
      />
    </div>
  );
}
