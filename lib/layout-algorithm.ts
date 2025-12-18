import {
  Student,
  Cell,
  SeatAssignment,
  GenderOption,
  Zone,
  ZoneStudentMapping,
} from "@/types";

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateLayout(
  cells: Cell[],
  students: Student[],
  zones: Zone[],
  zoneStudentMapping: ZoneStudentMapping[],
  genderOption?: GenderOption,
  existingAssignments?: SeatAssignment[]
): SeatAssignment[] {
  const activeCells = cells.filter((cell) => cell.isActive);

  // 기존 배치가 있으면 고정된 학생만 유지하고 나머지는 초기화
  let assignments: SeatAssignment[];
  if (existingAssignments) {
    // 활성 셀에 대한 배정 초기화
    assignments = activeCells.map((cell) => {
      const existing = existingAssignments.find(
        (a) => a.seat.r === cell.r && a.seat.c === cell.c
      );
      // 고정된 배정만 유지, 나머지는 초기화
      if (existing && existing.isLocked && existing.studentId) {
        return {
          seat: { r: cell.r, c: cell.c },
          studentId: existing.studentId,
          isLocked: true,
        };
      }
      return {
        seat: { r: cell.r, c: cell.c },
        studentId: null,
        isLocked: false,
      };
    });
  } else {
    // 새로 생성
    assignments = activeCells.map((cell) => ({
      seat: { r: cell.r, c: cell.c },
      studentId: null,
      isLocked: false,
    }));
  }

  // 1. Locked students 유지
  const lockedAssignments = assignments.filter((a) => a.isLocked);
  const lockedStudentIds = new Set(
    lockedAssignments.map((a) => a.studentId).filter((id): id is string => !!id)
  );

  // 같은 분단 내인지 확인 (분단형: 0-1, 2-3, 4-5... 열이 같은 분단)
  const isSameDivision = (col1: number, col2: number): boolean => {
    return Math.floor(col1 / 2) === Math.floor(col2 / 2);
  };

  // 지정구역 내에서 인접한 셀 쌍 찾기 헬퍼 함수 (같은 분단 내에서만)
  const findAdjacentPairInCells = (
    cells: Cell[],
    usedCells: Cell[]
  ): [Cell, Cell] | null => {
    for (const cell1 of cells) {
      if (usedCells.includes(cell1)) continue;

      // 같은 행, 같은 분단 내에서 인접한 열 찾기
      const cell2 = cells.find(
        (c) =>
          c.r === cell1.r &&
          Math.abs(c.c - cell1.c) === 1 &&
          isSameDivision(cell1.c, c.c) && // 같은 분단 내에서만
          !usedCells.includes(c)
      );

      if (cell2) {
        const assignment1 = assignments.find(
          (a) => a.seat.r === cell1.r && a.seat.c === cell1.c
        );
        const assignment2 = assignments.find(
          (a) => a.seat.r === cell2.r && a.seat.c === cell2.c
        );

        if (
          assignment1 &&
          assignment2 &&
          !assignment1.studentId &&
          !assignment2.studentId
        ) {
          return [cell1, cell2];
        }
      }
    }
    return null;
  };

  // 2. 각 지정구역별로 학생 배치
  const assignedStudentIds = new Set<string>();
  const unusedZoneCells: Cell[] = []; // 지정구역에서 사용되지 않은 좌석들

  for (const zone of zones) {
    const zoneMapping = zoneStudentMapping.find((m) => m.zoneId === zone.id);

    // 해당 구역의 좌석 필터링
    const zoneCells = activeCells.filter((cell) => cell.zoneId === zone.id);

    // 사용 가능한 좌석 필터링
    const availableZoneCells = zoneCells.filter((cell) => {
      const assignment = assignments.find(
        (a) => a.seat.r === cell.r && a.seat.c === cell.c
      );
      return assignment && !assignment.isLocked && !assignment.studentId;
    });

    // 지정구역에 학생이 할당되지 않은 경우, 모든 좌석을 unusedZoneCells에 추가
    if (!zoneMapping || zoneMapping.studentIds.length === 0) {
      unusedZoneCells.push(...availableZoneCells);
      continue;
    }

    // 해당 구역에 배정된 학생 필터링 (고정된 학생 제외)
    const zoneStudents = students.filter(
      (s) =>
        zoneMapping.studentIds.includes(s.id) && !lockedStudentIds.has(s.id)
    );

    // 성별 배치 옵션 적용
    if (genderOption && genderOption !== "랜덤") {
      const zoneMaleStudents = zoneStudents.filter((s) => s.gender === "M");
      const zoneFemaleStudents = zoneStudents.filter((s) => s.gender === "F");
      const zoneNoGenderStudents = zoneStudents.filter((s) => !s.gender);
      const usedCells: Cell[] = [];

      if (genderOption === "남녀 짝") {
        // 남녀 짝 만들기
        const shuffledMale = shuffleArray(zoneMaleStudents);
        const shuffledFemale = shuffleArray(zoneFemaleStudents);
        const pairs = Math.min(shuffledMale.length, shuffledFemale.length);

        for (let i = 0; i < pairs; i++) {
          const pair = findAdjacentPairInCells(availableZoneCells, usedCells);
          if (!pair) break;

          const [cell1, cell2] = pair;
          const assignment1 = assignments.find(
            (a) => a.seat.r === cell1.r && a.seat.c === cell1.c
          );
          const assignment2 = assignments.find(
            (a) => a.seat.r === cell2.r && a.seat.c === cell2.c
          );

          if (assignment1 && assignment2) {
            if (Math.random() < 0.5) {
              assignment1.studentId = shuffledMale[i].id;
              assignment2.studentId = shuffledFemale[i].id;
            } else {
              assignment1.studentId = shuffledFemale[i].id;
              assignment2.studentId = shuffledMale[i].id;
            }
            assignedStudentIds.add(shuffledMale[i].id);
            assignedStudentIds.add(shuffledFemale[i].id);
            usedCells.push(cell1, cell2);
          }
        }

        // 남은 학생들 랜덤 배치
        const remainingZoneStudents = zoneStudents.filter(
          (s) => !assignedStudentIds.has(s.id)
        );
        const remainingZoneCells = availableZoneCells.filter(
          (c) => !usedCells.includes(c)
        );
        const shuffledRemaining = shuffleArray(remainingZoneStudents);
        const shuffledRemainingCells = shuffleArray(remainingZoneCells);

        for (
          let i = 0;
          i < Math.min(shuffledRemaining.length, shuffledRemainingCells.length);
          i++
        ) {
          const cell = shuffledRemainingCells[i];
          const assignment = assignments.find(
            (a) => a.seat.r === cell.r && a.seat.c === cell.c
          );
          if (assignment && !assignment.studentId) {
            assignment.studentId = shuffledRemaining[i].id;
            assignedStudentIds.add(shuffledRemaining[i].id);
          }
        }
      } else if (genderOption === "동성 짝") {
        // 동성 짝 만들기
        const shuffledMale = shuffleArray(zoneMaleStudents);
        const shuffledFemale = shuffleArray(zoneFemaleStudents);

        // 남학생끼리 짝 만들기
        const malePairs = Math.floor(shuffledMale.length / 2);
        for (let i = 0; i < malePairs; i++) {
          const pair = findAdjacentPairInCells(availableZoneCells, usedCells);
          if (!pair) break;

          const [cell1, cell2] = pair;
          const assignment1 = assignments.find(
            (a) => a.seat.r === cell1.r && a.seat.c === cell1.c
          );
          const assignment2 = assignments.find(
            (a) => a.seat.r === cell2.r && a.seat.c === cell2.c
          );

          if (assignment1 && assignment2) {
            assignment1.studentId = shuffledMale[i * 2].id;
            assignment2.studentId = shuffledMale[i * 2 + 1].id;
            assignedStudentIds.add(shuffledMale[i * 2].id);
            assignedStudentIds.add(shuffledMale[i * 2 + 1].id);
            usedCells.push(cell1, cell2);
          }
        }

        // 여학생끼리 짝 만들기
        const femalePairs = Math.floor(shuffledFemale.length / 2);
        for (let i = 0; i < femalePairs; i++) {
          const pair = findAdjacentPairInCells(availableZoneCells, usedCells);
          if (!pair) break;

          const [cell1, cell2] = pair;
          const assignment1 = assignments.find(
            (a) => a.seat.r === cell1.r && a.seat.c === cell1.c
          );
          const assignment2 = assignments.find(
            (a) => a.seat.r === cell2.r && a.seat.c === cell2.c
          );

          if (assignment1 && assignment2) {
            assignment1.studentId = shuffledFemale[i * 2].id;
            assignment2.studentId = shuffledFemale[i * 2 + 1].id;
            assignedStudentIds.add(shuffledFemale[i * 2].id);
            assignedStudentIds.add(shuffledFemale[i * 2 + 1].id);
            usedCells.push(cell1, cell2);
          }
        }

        // 남은 학생들 랜덤 배치
        const remainingZoneStudents = zoneStudents.filter(
          (s) => !assignedStudentIds.has(s.id)
        );
        const remainingZoneCells = availableZoneCells.filter(
          (c) => !usedCells.includes(c)
        );
        const shuffledRemaining = shuffleArray(remainingZoneStudents);
        const shuffledRemainingCells = shuffleArray(remainingZoneCells);

        for (
          let i = 0;
          i < Math.min(shuffledRemaining.length, shuffledRemainingCells.length);
          i++
        ) {
          const cell = shuffledRemainingCells[i];
          const assignment = assignments.find(
            (a) => a.seat.r === cell.r && a.seat.c === cell.c
          );
          if (assignment && !assignment.studentId) {
            assignment.studentId = shuffledRemaining[i].id;
            assignedStudentIds.add(shuffledRemaining[i].id);
          }
        }
      }
    } else {
      // 랜덤 배치
      const shuffledStudents = shuffleArray(zoneStudents);
      const shuffledCells = shuffleArray(availableZoneCells);

      for (
        let i = 0;
        i < Math.min(shuffledStudents.length, shuffledCells.length);
        i++
      ) {
        const cell = shuffledCells[i];
        const assignment = assignments.find(
          (a) => a.seat.r === cell.r && a.seat.c === cell.c
        );
        if (assignment && !assignment.studentId) {
          assignment.studentId = shuffledStudents[i].id;
          assignedStudentIds.add(shuffledStudents[i].id);
        }
      }
    }

    // 지정구역에서 사용되지 않은 좌석들을 수집 (일반 좌석으로 사용)
    const usedZoneCells = availableZoneCells.filter((cell) => {
      const assignment = assignments.find(
        (a) => a.seat.r === cell.r && a.seat.c === cell.c
      );
      return assignment && assignment.studentId;
    });
    for (const cell of availableZoneCells) {
      if (!usedZoneCells.includes(cell)) {
        unusedZoneCells.push(cell);
      }
    }
  }

  // 3. 지정구역에 배정되지 않은 학생들을 일반 좌석에 배치
  const unassignedStudents = students.filter(
    (s) => !assignedStudentIds.has(s.id) && !lockedStudentIds.has(s.id)
  );

  const normalCells = activeCells.filter((cell) => {
    // 지정구역이 아니고, 아직 배정되지 않은 좌석
    return (
      !cell.zoneId &&
      !assignments.some(
        (a) => a.seat.r === cell.r && a.seat.c === cell.c && a.studentId
      )
    );
  });

  // 일반 좌석 + 지정구역에서 사용되지 않은 좌석들을 합침
  const remainingCells = [
    ...normalCells.filter((cell) => {
      const assignment = assignments.find(
        (a) => a.seat.r === cell.r && a.seat.c === cell.c
      );
      return assignment && !assignment.studentId;
    }),
    ...unusedZoneCells.filter((cell) => {
      const assignment = assignments.find(
        (a) => a.seat.r === cell.r && a.seat.c === cell.c
      );
      return assignment && !assignment.studentId;
    }),
  ];

  if (genderOption && genderOption !== "랜덤") {
    // 남녀 짝 또는 동성 짝 배치
    const maleStudents = unassignedStudents.filter((s) => s.gender === "M");
    const femaleStudents = unassignedStudents.filter((s) => s.gender === "F");
    const noGenderStudents = unassignedStudents.filter((s) => !s.gender);

    if (genderOption === "남녀 짝") {
      // 인접한 좌석에 남녀를 배치 (분단형: 같은 행의 같은 분단 내에서만)
      const shuffledMale = shuffleArray(maleStudents);
      const shuffledFemale = shuffleArray(femaleStudents);
      const pairs = Math.min(shuffledMale.length, shuffledFemale.length);
      const usedCells: Cell[] = [];

      // 인접한 셀 쌍 찾기 (같은 행에서 열이 1 차이 나는 경우)
      const findAdjacentPair = (): [Cell, Cell] | null => {
        return findAdjacentPairInCells(remainingCells, usedCells);
      };

      // 남녀 짝 만들기
      for (let i = 0; i < pairs; i++) {
        const pair = findAdjacentPair();
        if (!pair) break;

        const [cell1, cell2] = pair;
        const assignment1 = assignments.find(
          (a) => a.seat.r === cell1.r && a.seat.c === cell1.c
        );
        const assignment2 = assignments.find(
          (a) => a.seat.r === cell2.r && a.seat.c === cell2.c
        );

        if (assignment1 && assignment2) {
          // 랜덤하게 남학생 또는 여학생을 첫 번째 셀에 배치
          if (Math.random() < 0.5) {
            assignment1.studentId = shuffledMale[i].id;
            assignment2.studentId = shuffledFemale[i].id;
          } else {
            assignment1.studentId = shuffledFemale[i].id;
            assignment2.studentId = shuffledMale[i].id;
          }
          usedCells.push(cell1, cell2);
        }
      }

      // 남은 학생들(성별 없는 학생 포함)을 성별 옵션에 맞게 배치
      const remainingAfterPairs = unassignedStudents.filter(
        (s) =>
          !assignments.some(
            (a) =>
              a.studentId === s.id &&
              usedCells.some((c) => c.r === a.seat.r && c.c === a.seat.c)
          )
      );
      const remainingAfterPairsCells = remainingCells.filter(
        (c) => !usedCells.includes(c)
      );

      // 인접 자리에 다른 성별 학생이 있는 자리를 우선 배치 (남녀 짝)
      const getAdjacentStudentGender = (cell: Cell): "M" | "F" | null => {
        const adjacentCell = activeCells.find(
          (c) =>
            c.r === cell.r &&
            Math.abs(c.c - cell.c) === 1 &&
            isSameDivision(cell.c, c.c)
        );
        if (!adjacentCell) return null;
        const adjacentAssignment = assignments.find(
          (a) => a.seat.r === adjacentCell.r && a.seat.c === adjacentCell.c
        );
        if (!adjacentAssignment?.studentId) return null;
        const adjacentStudent = students.find(
          (s) => s.id === adjacentAssignment.studentId
        );
        return adjacentStudent?.gender || null;
      };

      // 남은 학생들을 성별별로 분류
      const remainingMale = remainingAfterPairs.filter((s) => s.gender === "M");
      const remainingFemale = remainingAfterPairs.filter((s) => s.gender === "F");
      const remainingNoGender = remainingAfterPairs.filter((s) => !s.gender);

      // 인접에 여학생이 있는 자리에 남학생 배치, 인접에 남학생이 있는 자리에 여학생 배치
      const shuffledRemainingMale = shuffleArray(remainingMale);
      const shuffledRemainingFemale = shuffleArray(remainingFemale);
      let maleIndex = 0;
      let femaleIndex = 0;

      for (const cell of shuffleArray(remainingAfterPairsCells)) {
        const assignment = assignments.find(
          (a) => a.seat.r === cell.r && a.seat.c === cell.c
        );
        if (!assignment || assignment.studentId) continue;

        const adjacentGender = getAdjacentStudentGender(cell);
        
        if (adjacentGender === "F" && maleIndex < shuffledRemainingMale.length) {
          // 인접에 여학생이 있으면 남학생 배치
          assignment.studentId = shuffledRemainingMale[maleIndex].id;
          maleIndex++;
        } else if (adjacentGender === "M" && femaleIndex < shuffledRemainingFemale.length) {
          // 인접에 남학생이 있으면 여학생 배치
          assignment.studentId = shuffledRemainingFemale[femaleIndex].id;
          femaleIndex++;
        }
      }

      // 아직 배치되지 않은 학생들 랜덤 배치
      const stillRemaining = [
        ...shuffledRemainingMale.slice(maleIndex),
        ...shuffledRemainingFemale.slice(femaleIndex),
        ...remainingNoGender,
      ];
      const stillRemainingCells = remainingAfterPairsCells.filter((c) => {
        const assignment = assignments.find(
          (a) => a.seat.r === c.r && a.seat.c === c.c
        );
        return assignment && !assignment.studentId;
      });

      const shuffledStillRemaining = shuffleArray(stillRemaining);
      const shuffledStillRemainingCells = shuffleArray(stillRemainingCells);

      for (
        let i = 0;
        i < Math.min(shuffledStillRemaining.length, shuffledStillRemainingCells.length);
        i++
      ) {
        const cell = shuffledStillRemainingCells[i];
        const assignment = assignments.find(
          (a) => a.seat.r === cell.r && a.seat.c === cell.c
        );
        if (assignment && !assignment.studentId) {
          assignment.studentId = shuffledStillRemaining[i].id;
        }
      }
    } else if (genderOption === "동성 짝") {
      // 동성 학생들을 인접하게 배치 (남학생끼리, 여학생끼리)
      const shuffledMale = shuffleArray(maleStudents);
      const shuffledFemale = shuffleArray(femaleStudents);
      const usedCells: Cell[] = [];

      // 인접한 셀 쌍 찾기 (같은 행에서 열이 1 차이 나는 경우)
      const findAdjacentPair = (): [Cell, Cell] | null => {
        return findAdjacentPairInCells(remainingCells, usedCells);
      };

      // 남학생끼리 짝 만들기
      const malePairs = Math.floor(shuffledMale.length / 2);
      for (let i = 0; i < malePairs; i++) {
        const pair = findAdjacentPair();
        if (!pair) break;

        const [cell1, cell2] = pair;
        const assignment1 = assignments.find(
          (a) => a.seat.r === cell1.r && a.seat.c === cell1.c
        );
        const assignment2 = assignments.find(
          (a) => a.seat.r === cell2.r && a.seat.c === cell2.c
        );

        if (assignment1 && assignment2) {
          assignment1.studentId = shuffledMale[i * 2].id;
          assignment2.studentId = shuffledMale[i * 2 + 1].id;
          usedCells.push(cell1, cell2);
        }
      }

      // 여학생끼리 짝 만들기
      const femalePairs = Math.floor(shuffledFemale.length / 2);
      for (let i = 0; i < femalePairs; i++) {
        const pair = findAdjacentPair();
        if (!pair) break;

        const [cell1, cell2] = pair;
        const assignment1 = assignments.find(
          (a) => a.seat.r === cell1.r && a.seat.c === cell1.c
        );
        const assignment2 = assignments.find(
          (a) => a.seat.r === cell2.r && a.seat.c === cell2.c
        );

        if (assignment1 && assignment2) {
          assignment1.studentId = shuffledFemale[i * 2].id;
          assignment2.studentId = shuffledFemale[i * 2 + 1].id;
          usedCells.push(cell1, cell2);
        }
      }

      // 남은 학생들을 성별 옵션에 맞게 배치 (동성 짝)
      const remainingAfterPairs = unassignedStudents.filter(
        (s) =>
          !assignments.some(
            (a) =>
              a.studentId === s.id &&
              usedCells.some((c) => c.r === a.seat.r && c.c === a.seat.c)
          )
      );
      const remainingAfterPairsCells = remainingCells.filter(
        (c) => !usedCells.includes(c)
      );

      // 인접 자리에 같은 성별 학생이 있는 자리를 우선 배치 (동성 짝)
      const getAdjacentStudentGender = (cell: Cell): "M" | "F" | null => {
        const adjacentCell = activeCells.find(
          (c) =>
            c.r === cell.r &&
            Math.abs(c.c - cell.c) === 1 &&
            isSameDivision(cell.c, c.c)
        );
        if (!adjacentCell) return null;
        const adjacentAssignment = assignments.find(
          (a) => a.seat.r === adjacentCell.r && a.seat.c === adjacentCell.c
        );
        if (!adjacentAssignment?.studentId) return null;
        const adjacentStudent = students.find(
          (s) => s.id === adjacentAssignment.studentId
        );
        return adjacentStudent?.gender || null;
      };

      // 남은 학생들을 성별별로 분류
      const remainingMale = remainingAfterPairs.filter((s) => s.gender === "M");
      const remainingFemale = remainingAfterPairs.filter((s) => s.gender === "F");
      const remainingNoGender = remainingAfterPairs.filter((s) => !s.gender);

      // 인접에 남학생이 있는 자리에 남학생 배치, 인접에 여학생이 있는 자리에 여학생 배치
      const shuffledRemainingMale = shuffleArray(remainingMale);
      const shuffledRemainingFemale = shuffleArray(remainingFemale);
      let maleIndex = 0;
      let femaleIndex = 0;

      for (const cell of shuffleArray(remainingAfterPairsCells)) {
        const assignment = assignments.find(
          (a) => a.seat.r === cell.r && a.seat.c === cell.c
        );
        if (!assignment || assignment.studentId) continue;

        const adjacentGender = getAdjacentStudentGender(cell);
        
        if (adjacentGender === "M" && maleIndex < shuffledRemainingMale.length) {
          // 인접에 남학생이 있으면 남학생 배치
          assignment.studentId = shuffledRemainingMale[maleIndex].id;
          maleIndex++;
        } else if (adjacentGender === "F" && femaleIndex < shuffledRemainingFemale.length) {
          // 인접에 여학생이 있으면 여학생 배치
          assignment.studentId = shuffledRemainingFemale[femaleIndex].id;
          femaleIndex++;
        }
      }

      // 아직 배치되지 않은 학생들 랜덤 배치
      const stillRemaining = [
        ...shuffledRemainingMale.slice(maleIndex),
        ...shuffledRemainingFemale.slice(femaleIndex),
        ...remainingNoGender,
      ];
      const stillRemainingCells = remainingAfterPairsCells.filter((c) => {
        const assignment = assignments.find(
          (a) => a.seat.r === c.r && a.seat.c === c.c
        );
        return assignment && !assignment.studentId;
      });

      const shuffledStillRemaining = shuffleArray(stillRemaining);
      const shuffledStillRemainingCells = shuffleArray(stillRemainingCells);

      for (
        let i = 0;
        i < Math.min(shuffledStillRemaining.length, shuffledStillRemainingCells.length);
        i++
      ) {
        const cell = shuffledStillRemainingCells[i];
        const assignment = assignments.find(
          (a) => a.seat.r === cell.r && a.seat.c === cell.c
        );
        if (assignment && !assignment.studentId) {
          assignment.studentId = shuffledStillRemaining[i].id;
        }
      }
    }
  } else {
    // 4. Normal Placement (랜덤)
    const shuffledRemaining = shuffleArray(unassignedStudents);
    const shuffledRemainingCells = shuffleArray(remainingCells);

    for (
      let i = 0;
      i < Math.min(shuffledRemaining.length, shuffledRemainingCells.length);
      i++
    ) {
      const cell = shuffledRemainingCells[i];
      const assignment = assignments.find(
        (a) => a.seat.r === cell.r && a.seat.c === cell.c
      );
      if (assignment && !assignment.studentId) {
        assignment.studentId = shuffledRemaining[i].id;
      }
    }
  }

  return assignments;
}
