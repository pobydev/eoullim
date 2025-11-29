"use client";

import { useState, useEffect } from "react";
import { Zone, ZoneStudentMapping, Student, Cell } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ZoneStudentAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: Zone[];
  students: Student[];
  cells: Cell[];
  zoneStudentMapping?: ZoneStudentMapping[];
  onConfirm: (mapping: ZoneStudentMapping[]) => void;
}

export default function ZoneStudentAssignmentDialog({
  open,
  onOpenChange,
  zones,
  students,
  cells,
  zoneStudentMapping,
  onConfirm,
}: ZoneStudentAssignmentDialogProps) {
  const [zoneMappings, setZoneMappings] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    if (open) {
      // 기존 매핑이 있으면 사용, 없으면 초기화
      if (zoneStudentMapping && zoneStudentMapping.length > 0) {
        const initialMappings: Record<string, Set<string>> = {};
        zones.forEach((zone) => {
          const existingMapping = zoneStudentMapping.find((m) => m.zoneId === zone.id);
          initialMappings[zone.id] = existingMapping
            ? new Set(existingMapping.studentIds)
            : new Set();
        });
        setZoneMappings(initialMappings);
      } else {
        // 초기화: 각 구역별로 빈 Set 생성
        const initialMappings: Record<string, Set<string>> = {};
        zones.forEach((zone) => {
          initialMappings[zone.id] = new Set();
        });
        setZoneMappings(initialMappings);
      }
    }
  }, [open, zones, zoneStudentMapping]);

  const toggleStudentInZone = (zoneId: string, studentId: string) => {
    setZoneMappings((prev) => {
      const newMappings = { ...prev };
      const zoneSet = new Set(newMappings[zoneId] || []);
      
      if (zoneSet.has(studentId)) {
        zoneSet.delete(studentId);
      } else {
        // 다른 구역에서 제거
        Object.keys(newMappings).forEach((zid) => {
          if (zid !== zoneId) {
            newMappings[zid] = new Set([...newMappings[zid]].filter((id) => id !== studentId));
          }
        });
        zoneSet.add(studentId);
      }
      
      newMappings[zoneId] = zoneSet;
      return newMappings;
    });
  };

  const getZoneSeatCount = (zoneId: string): number => {
    return cells.filter((cell) => cell.isActive && cell.zoneId === zoneId).length;
  };

  const getZoneStudentCount = (zoneId: string): number => {
    return zoneMappings[zoneId]?.size || 0;
  };

  const getUnassignedStudents = (): Student[] => {
    const assignedStudentIds = new Set<string>();
    Object.values(zoneMappings).forEach((studentSet) => {
      studentSet.forEach((id) => assignedStudentIds.add(id));
    });
    return students.filter((s) => !assignedStudentIds.has(s.id));
  };

  const handleConfirm = () => {
    // 유효성 검사
    for (const zone of zones) {
      const seatCount = getZoneSeatCount(zone.id);
      const studentCount = getZoneStudentCount(zone.id);
      
      if (studentCount > seatCount) {
        alert(`${zone.name} 구역의 좌석이 부족합니다! (학생: ${studentCount}명, 좌석: ${seatCount}석)`);
        return;
      }
    }

    // ZoneStudentMapping 배열로 변환
    const mapping: ZoneStudentMapping[] = zones.map((zone) => ({
      zoneId: zone.id,
      studentIds: Array.from(zoneMappings[zone.id] || []),
    }));

    onConfirm(mapping);
    onOpenChange(false);
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

  const sortedStudents = [...students].sort((a, b) => {
    const numA = a.attendanceNumber || 0;
    const numB = b.attendanceNumber || 0;
    return numA - numB;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>지정구역별 학생 배정</DialogTitle>
          <DialogDescription>
            각 지정구역에 배정할 학생을 선택하세요. 학생은 하나의 구역에만 배정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {zones.map((zone) => {
            const seatCount = getZoneSeatCount(zone.id);
            const studentCount = getZoneStudentCount(zone.id);
            const isOverCapacity = studentCount > seatCount;

            return (
              <div key={zone.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 ${getColorClass(zone.color)}`} />
                    <Label className="text-base font-semibold">{zone.name}</Label>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className={cn(isOverCapacity && "text-red-500 font-semibold")}>
                      학생: {studentCount}명
                    </span>
                    {" / "}
                    <span>좌석: {seatCount}석</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {sortedStudents.map((student) => {
                    const isSelected = zoneMappings[zone.id]?.has(student.id) || false;
                    // 다른 구역에 배정되어 있는지 확인
                    const isAssignedToOtherZone = Object.keys(zoneMappings).some(
                      (zid) => zid !== zone.id && zoneMappings[zid]?.has(student.id)
                    );
                    return (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded cursor-pointer",
                          isSelected && "bg-blue-50",
                          isAssignedToOtherZone && !isSelected && "opacity-50 bg-gray-100",
                          !isSelected && !isAssignedToOtherZone && "hover:bg-gray-50"
                        )}
                        onClick={() => toggleStudentInZone(zone.id, student.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStudentInZone(zone.id, student.id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={false}
                        />
                        <Label className="text-sm cursor-pointer flex-1">
                          {student.attendanceNumber && (
                            <span className="text-gray-500 mr-1">{student.attendanceNumber}.</span>
                          )}
                          {student.name}
                          {isAssignedToOtherZone && !isSelected && (
                            <span className="ml-1 text-xs text-gray-400">(다른 구역)</span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {getUnassignedStudents().length > 0 && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <Label className="text-base font-semibold text-gray-600">
                배정되지 않은 학생 ({getUnassignedStudents().length}명)
              </Label>
              <div className="text-sm text-gray-500">
                이 학생들은 일반 좌석에 배정됩니다.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleConfirm}>지정구역 배정</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

