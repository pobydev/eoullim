// 합성(가짜) 테스트 데이터. 실제 학생 이름은 쓰지 않아요.
import type {
  Cell,
  ClassRoster,
  Layout,
  LayoutConfig,
  SeatAssignment,
  Student,
} from "../../types";

export const FIXED_NOW = new Date("2026-11-10T03:00:00.000Z");

export function students(
  prefix: string,
  genders: Student["gender"][],
  numbers?: (number | undefined)[]
): Student[] {
  return genders.map((gender, i) => ({
    id: `${prefix}${i + 1}`,
    name: `가상학생${prefix.toUpperCase()}${String(i + 1).padStart(2, "0")}`,
    gender,
    attendanceNumber: numbers ? numbers[i] : i + 1,
  }));
}

/** rows×cols 좌석(모두 사용). patch로 일부 좌석을 바꿔요. */
export function grid(
  rows: number,
  cols: number,
  patch: Record<string, Partial<Cell>> = {}
): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({ r, c, isActive: true, zoneId: null, ...patch[`${r}:${c}`] });
  return cells;
}

/** 웹처럼 활성 좌석마다 배정 항목을 만들고, seats로 학생/고정을 채워요. */
export function seats(
  cells: Cell[],
  placed: Record<string, string | [string | null, "locked"]>
): SeatAssignment[] {
  const list: SeatAssignment[] = cells
    .filter((c) => c.isActive)
    .map((c) => ({ seat: { r: c.r, c: c.c }, studentId: null, isLocked: false }));
  for (const [key, value] of Object.entries(placed)) {
    const [r, c] = key.split(":").map(Number);
    const studentId = Array.isArray(value) ? value[0] : value;
    const isLocked = Array.isArray(value);
    const existing = list.find((a) => a.seat.r === r && a.seat.c === c);
    if (existing) Object.assign(existing, { studentId, isLocked });
    else list.push({ seat: { r, c }, studentId, isLocked });
  }
  return list;
}

export function layout(
  id: string,
  classId: string,
  title: string,
  config: Partial<LayoutConfig> & Pick<LayoutConfig, "rows" | "cols">,
  cells: Cell[],
  currentAssignment: SeatAssignment[],
  extra: Partial<Layout> = {}
): Layout {
  return {
    id,
    classId,
    title,
    config: { zones: [], ...config },
    cells,
    currentAssignment,
    ...extra,
  };
}

// ---- 1반: 기본형, 통로 1칸, 성별 미지정 학생 ----
export const rosterBasic: ClassRoster = {
  id: "roster-basic",
  className: "가상 1반",
  students: students("a", ["M", "F", "M", "F", "M", undefined]),
  createdAt: new Date("2026-03-01T00:00:00Z"),
};
const basicCells = grid(2, 4, { "1:3": { isActive: false } });
export const layoutBasic = layout(
  "layout-basic",
  "roster-basic",
  "1반 3월 배치",
  { rows: 2, cols: 4, layoutType: "기본형", genderOption: "남녀 짝" },
  basicCells,
  seats(basicCells, {
    "0:0": "a1",
    "0:1": "a2",
    "0:2": "a3",
    "0:3": "a4",
    "1:0": "a5",
    "1:1": "a6",
  }),
  { createdAt: new Date("2026-03-02T00:00:00Z") }
);

// ---- 2반: 분단형(3분단 = 6열), 저장 배치 2개, 고정석, 지워진 학생, 중복 배치 ----
export const rosterPairs: ClassRoster = {
  id: "roster-pairs",
  className: "  가상 2반  ",
  students: students("b", ["M", "M", "F", "F", "M", "F", "M", "F"]),
};
const pairsOldCells = grid(2, 6);
export const layoutPairsOld = layout(
  "layout-pairs-old",
  "roster-pairs",
  "2반 3월",
  { rows: 2, cols: 6, layoutType: "분단형", genderOption: "랜덤" },
  pairsOldCells,
  seats(pairsOldCells, { "0:0": "b1", "0:1": "b2", "1:0": "b3" }),
  { createdAt: new Date("2026-03-03T00:00:00Z") }
);
const pairsNewCells = grid(2, 6, { "1:5": { isActive: false } });
export const layoutPairsNew = layout(
  "layout-pairs-new",
  "roster-pairs",
  "2반 4월 짝 바꾸기",
  { rows: 2, cols: 6, layoutType: "분단형", genderOption: "동성 짝" },
  pairsNewCells,
  [
    ...seats(pairsNewCells, {
      "0:0": ["b1", "locked"],
      "0:1": "b2",
      "0:2": "b3",
      "0:3": "b4",
      "0:4": "b5",
      "0:5": "deleted-student", // 명단에서 지워진 학생
      "1:0": "b6",
      "1:1": "b7",
      "1:2": "b8",
      "1:3": "b2", // 같은 학생이 두 번 → 두 번째는 비워요
      "1:4": [null, "locked"], // 학생 없는 고정 → 고정 해제
    }),
    { seat: { r: 1, c: 5 }, studentId: "b4", isLocked: true }, // 통로에 남은 배정 → 버려요
  ],
  { createdAt: new Date("2026-04-01T00:00:00Z") }
);

// ---- 3반: 모둠형(4인) 6×6, 지정구역, 고정석 ----
export const rosterGroups: ClassRoster = {
  id: "roster-groups",
  className: "가상 3반",
  students: students(
    "c",
    ["M", "F", "M", "F", "M", "F", "M", "F", "M", "F", "M", "F"]
  ),
};
const groupsCells = grid(6, 6, {
  "0:0": { zoneId: "zone-front" },
  "0:1": { zoneId: "zone-front" },
  "0:2": { zoneId: "zone-front" },
  "0:3": { zoneId: "zone-front" },
  "0:5": { zoneId: "zone-missing" }, // 없는 구역 → 지워요
  "2:0": { isActive: false, zoneId: "zone-window" }, // 통로에는 구역을 둘 수 없어요
  "1:5": { zoneId: "zone-window" },
  "5:4": { zoneId: "zone-back" },
  "5:5": { zoneId: "zone-back" },
});
export const layoutGroups = layout(
  "layout-groups",
  "roster-groups",
  "3반 모둠 활동",
  {
    rows: 6,
    cols: 6,
    layoutType: "모둠형(4인)",
    genderOption: "남녀 짝",
    zones: [
      { id: "zone-front", name: "앞자리", color: "lime" },
      {
        id: "zone-window",
        name: "창가 쪽 자리 이름이 아주 길어서 스물네 글자를 넘는 구역",
        color: "yellow",
      },
      { id: "zone-back", name: "뒷자리", color: "orange" },
    ],
  },
  groupsCells,
  seats(groupsCells, {
    "0:0": ["c1", "locked"], // 구역 안 고정석
    "0:1": "c2",
    "3:3": ["c4", "locked"], // 뒷자리 구역 학생이 구역 밖에 고정 → 구역 배정을 풀어요
    "5:5": "c6",
  }),
  {
    createdAt: new Date("2026-05-01T00:00:00Z"),
    zoneStudentMapping: [
      { zoneId: "zone-front", studentIds: ["c1", "c2", "c3", "deleted-x"] },
      { zoneId: "zone-back", studentIds: ["c4", "c1"] },
      { zoneId: "zone-window", studentIds: ["c5"] },
      { zoneId: "zone-gone", studentIds: ["c7"] },
    ],
  }
);

// ---- 4반: 출석번호 없음/중복, 자리표 없음 ----
export const rosterNoLayouts: ClassRoster = {
  id: "roster-nolayout",
  className: "가상 4반",
  students: [
    ...students("d", ["M", "F", "M", "F", "M"], [1, undefined, 1, 5, undefined]),
  ].map((s, i) => (i === 1 ? { ...s, name: `  ${s.name}  ` } : s)),
};

// ---- 지워진 학급의 자리표 ----
export const layoutOrphan = layout(
  "layout-orphan",
  "roster-deleted",
  "지워진 학급 배치",
  { rows: 1, cols: 2 },
  grid(1, 2),
  [],
  { createdAt: new Date("2026-06-01T00:00:00Z") }
);

export function sampleInput() {
  return {
    rosters: [rosterBasic, rosterPairs, rosterGroups, rosterNoLayouts],
    layouts: [layoutBasic, layoutPairsOld, layoutGroups, layoutPairsNew, layoutOrphan],
    teacherName: "가상 선생님",
    now: FIXED_NOW,
  };
}
