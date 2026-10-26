// 웹 데이터(학급 명단 + 저장한 자리표)를 PC판 어울림의 "백업 불러오기" 형식으로 바꾸는 순수 함수.
// 출력 형식은 PC 저장소의 shared/schema.ts(appDataSchema)를 따라요.
// 이 모듈은 브라우저·Firebase에 의존하지 않아서 테스트에서 바로 쓸 수 있어요.

import type { ClassRoster, Layout } from "@/types";

// ---------- PC판 형식 (shared/schema.ts와 같은 모양) ----------

export type PcGender = "M" | "F" | "U";
export type PcZoneColor = "sage" | "peach" | "lilac" | "sky" | "rose";
export type PcLayout = "single" | "pairs" | "groups";
export type PcPairing = "random" | "mixed" | "same";

export interface PcStudent {
  id: string;
  name: string;
  number: number;
  gender: PcGender;
  zoneId: string | null;
}

export interface PcZone {
  id: string;
  name: string;
  color: PcZoneColor;
}

export interface PcCell {
  r: number;
  c: number;
  active: boolean;
  zoneId: string | null;
  studentId: string | null;
  locked: boolean;
}

export interface PcWorkspace {
  students: PcStudent[];
  rows: number;
  cols: number;
  layout: PcLayout;
  pairing: PcPairing;
  zones: PcZone[];
  cells: PcCell[];
  separationPairs: { first: string; second: string }[];
  avoidSeats: { seats: string[]; studentIds: string[] };
}

export interface PcSnapshot {
  id: string;
  title: string;
  createdAt: string;
  workspace: PcWorkspace;
}

export interface PcClassroom {
  id: string;
  name: string;
  isDemo: boolean;
  workspace: PcWorkspace;
  history: PcSnapshot[];
}

export interface PcAppData {
  version: 1;
  activeClassId: string;
  classes: PcClassroom[];
  preferences: {
    animation: boolean;
    sound: boolean;
    soundVolume: number;
    /** PC판 1.4 이후 추가(기본 false). 예전 PC판은 모르는 키를 무시해요. */
    countdown: boolean;
    teacherName: string;
  };
}

export type PcExportResult =
  | { ok: true; data: PcAppData; warnings: string[] }
  | { ok: false; reason: "no-classes" };

export interface PcExportInput {
  rosters: ClassRoster[];
  layouts: Layout[];
  teacherName?: string | null;
  /** 저장 시각이 없는 자리표에 쓸 기준 시각. 테스트에서 고정값을 넣어요. */
  now?: Date;
}

// ---------- PC판 한도 ----------

export const PC_LIMITS = {
  classes: 30,
  students: 64,
  gridMax: 8,
  zones: 5,
  history: 100,
  studentName: 40,
  className: 40,
  zoneName: 24,
  snapshotTitle: 80,
  teacherName: 30,
  id: 100,
  maxNumber: 999,
} as const;

const PC_ZONE_COLORS: PcZoneColor[] = ["sage", "peach", "lilac", "sky", "rose"];
const WEB_TO_PC_COLOR: Record<string, PcZoneColor> = {
  lime: "sage",
  yellow: "peach",
  rose: "rose",
  violet: "lilac",
  orange: "peach",
};

// ---------- 작은 도우미 ----------

/** 앞뒤 공백을 지우고 max 글자(UTF-16 기준, 스키마와 같음)로 자르기. 서로게이트 쌍은 쪼개지 않아요. */
function clip(value: unknown, max: number): string {
  let s = typeof value === "string" ? value.trim() : "";
  if (s.length <= max) return s;
  s = s.slice(0, max);
  const last = s.charCodeAt(s.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) s = s.slice(0, -1);
  return s.trim();
}

function isValidId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= PC_LIMITS.id
  );
}

/** 이미 쓴 id와 겹치지 않는 id를 돌려줘요. */
function uniqueId(
  preferred: unknown,
  fallback: string,
  used: Set<string>
): string {
  let id = isValidId(preferred) && !used.has(preferred) ? preferred : fallback;
  for (let n = 2; used.has(id); n++) id = `${fallback}-${n}`;
  used.add(id);
  return id;
}

function toInt(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.trim()) : value;
  return typeof n === "number" && Number.isInteger(n) ? n : null;
}

/** Date, Firestore Timestamp(toDate), 문자열, 숫자를 시각(ms)으로. 알 수 없으면 null. */
function toTime(value: unknown): number | null {
  if (value == null) return null;
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (
    typeof value === "object" &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  )
    date = (value as { toDate: () => Date }).toDate();
  else if (typeof value === "string" || typeof value === "number")
    date = new Date(value);
  const t = date?.getTime();
  // toISOString이 다룰 수 있는 범위(0000~9999년)만 받아요.
  if (t == null || Number.isNaN(t) || t < -62167219200000 || t > 253402300799999)
    return null;
  return t;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

// ---------- 학생 ----------

interface StudentTable {
  students: PcStudent[];
  /** 웹 학생 id → PC 학생 id */
  idMap: Map<string, string>;
}

function mapStudents(
  roster: ClassRoster,
  label: string,
  warnings: string[]
): StudentTable {
  const source = Array.isArray(roster.students) ? roster.students : [];
  if (source.length > PC_LIMITS.students) {
    warnings.push(
      `${label}: 학생이 ${source.length}명이라 PC판 한도(${PC_LIMITS.students}명)에 맞춰 앞의 ${PC_LIMITS.students}명만 옮겼어요.`
    );
  }
  const kept = source.slice(0, PC_LIMITS.students);

  // 1) 올바르고 겹치지 않는 출석번호는 그대로 써요.
  const usedNumbers = new Set<number>();
  const numbers: (number | null)[] = kept.map((s) => {
    const n = toInt(s?.attendanceNumber);
    if (n == null || n < 1 || n > PC_LIMITS.maxNumber || usedNumbers.has(n))
      return null;
    usedNumbers.add(n);
    return n;
  });
  // 2) 없거나 겹치는 번호는 가장 큰 번호 다음부터 차례로 붙여요.
  let next = usedNumbers.size ? Math.max(...Array.from(usedNumbers)) + 1 : 1;
  let renumbered = 0;
  const takeNext = () => {
    for (let guard = 0; guard <= PC_LIMITS.maxNumber; guard++) {
      if (next > PC_LIMITS.maxNumber) next = 1;
      if (!usedNumbers.has(next)) {
        usedNumbers.add(next);
        return next++;
      }
      next++;
    }
    throw new Error("출석번호를 붙일 수 없어요.");
  };
  const finalNumbers = numbers.map((n) => {
    if (n != null) return n;
    renumbered++;
    return takeNext();
  });
  if (renumbered > 0) {
    warnings.push(
      `${label}: 출석번호가 없거나 겹치는 학생 ${renumbered}명에게 새 번호를 붙였어요.`
    );
  }

  const usedIds = new Set<string>();
  const idMap = new Map<string, string>();
  let clippedNames = 0;
  const students = kept.map((s, i) => {
    const id = uniqueId(s?.id, `student-${i + 1}`, usedIds);
    if (typeof s?.id === "string" && !idMap.has(s.id)) idMap.set(s.id, id);
    const rawName = typeof s?.name === "string" ? s.name.trim() : "";
    let name = clip(rawName, PC_LIMITS.studentName);
    if (rawName.length > PC_LIMITS.studentName) clippedNames++;
    if (!name) name = `학생 ${finalNumbers[i]}`;
    const gender: PcGender =
      s?.gender === "M" ? "M" : s?.gender === "F" ? "F" : "U";
    return { id, name, number: finalNumbers[i], gender, zoneId: null };
  });
  if (clippedNames > 0) {
    warnings.push(
      `${label}: 이름이 ${PC_LIMITS.studentName}자를 넘는 학생 ${clippedNames}명의 이름을 줄였어요.`
    );
  }
  return { students, idMap };
}

// ---------- 지정구역 ----------

function mapZones(layout: Layout, label: string, warnings: string[]): PcZone[] {
  const source = Array.isArray(layout.config?.zones) ? layout.config.zones : [];
  const seen = new Set<string>();
  const unique = source.filter((z) => {
    if (!z || !isValidId(z.id) || seen.has(z.id)) return false;
    seen.add(z.id);
    return true;
  });
  if (unique.length > PC_LIMITS.zones) {
    warnings.push(
      `${label}: 지정구역이 ${unique.length}개라 앞의 ${PC_LIMITS.zones}개만 옮겼어요.`
    );
  }
  const zones: PcZone[] = [];
  unique.slice(0, PC_LIMITS.zones).forEach((z, i) => {
    // 웹 색을 PC 색으로 바꾸되, 같은 색이 겹치면 아직 안 쓴 색을 골라요(PC판과 같은 규칙).
    let color = WEB_TO_PC_COLOR[z.color];
    if (!color || zones.some((p) => p.color === color)) {
      color =
        PC_ZONE_COLORS.find((c) => !zones.some((p) => p.color === c)) ?? "sage";
    }
    const name = clip(z.name, PC_LIMITS.zoneName) || `지정구역 ${i + 1}`;
    zones.push({ id: z.id, name, color });
  });
  return zones;
}

// ---------- 자리표 → 작업 공간 ----------

function mapLayoutType(type: unknown): PcLayout {
  if (type === "분단형") return "pairs";
  if (type === "모둠형(4인)") return "groups";
  return "single";
}

function mapPairing(option: unknown): PcPairing {
  if (option === "남녀 짝") return "mixed";
  if (option === "동성 짝") return "same";
  return "random";
}

function emptyCells(rows: number, cols: number, active: boolean): PcCell[] {
  return Array.from({ length: rows * cols }, (_, i) => ({
    r: Math.floor(i / cols),
    c: i % cols,
    active,
    zoneId: null,
    studentId: null,
    locked: false,
  }));
}

/** 자리표가 없는 학급: 명단이 들어갈 만한 기본형 교실(모든 자리 사용, 학생은 아직 배치 안 함). */
export function defaultWorkspace(students: PcStudent[]): PcWorkspace {
  const n = students.length;
  const cols = n === 0 ? 6 : clamp(Math.ceil(Math.sqrt(n)), 1, PC_LIMITS.gridMax);
  const rows = n === 0 ? 5 : clamp(Math.ceil(n / cols), 1, PC_LIMITS.gridMax);
  return {
    students: students.map((s) => ({ ...s, zoneId: null })),
    rows,
    cols,
    layout: "single",
    pairing: "random",
    zones: [],
    cells: emptyCells(rows, cols, true),
    separationPairs: [],
    avoidSeats: { seats: [], studentIds: [] },
  };
}

function mapWorkspace(
  layout: Layout,
  table: StudentTable,
  label: string,
  warnings: string[]
): PcWorkspace {
  const webCells = Array.isArray(layout.cells) ? layout.cells : [];
  const assignments = Array.isArray(layout.currentAssignment)
    ? layout.currentAssignment
    : [];

  // 행·열: 설정값이 이상하면 좌석 좌표로 추정해요.
  const maxR = webCells.reduce((m, c) => Math.max(m, toInt(c?.r) ?? 0), 0);
  const maxC = webCells.reduce((m, c) => Math.max(m, toInt(c?.c) ?? 0), 0);
  const webRows = toInt(layout.config?.rows) ?? (webCells.length ? maxR + 1 : 6);
  const webCols = toInt(layout.config?.cols) ?? (webCells.length ? maxC + 1 : 6);
  let layoutType = mapLayoutType(layout.config?.layoutType);

  let rows = clamp(webRows, 1, PC_LIMITS.gridMax);
  let cols = clamp(webCols, 1, PC_LIMITS.gridMax);
  const resized = rows !== webRows || cols !== webCols;

  // 분단형·모둠형: 웹은 2열씩 묶어 그리고 남는 홀수 열은 화면에 그리지 않아요.
  // PC판도 (0,1),(2,3)… 열을 짝으로 묶으므로 열 수를 짝수로 맞춰요.
  let droppedOddColumn = false;
  if (layoutType !== "single" && cols % 2 === 1) {
    if (cols === 1) layoutType = "single";
    else {
      cols -= 1;
      droppedOddColumn = true;
    }
  }
  // 모둠형: PC판은 2행씩 묶어요. 홀수 행이면 맨 아래에 빈 통로 행을 하나 더해요(모든 자리 유지).
  let paddedRow = -1;
  if (layoutType === "groups" && rows % 2 === 1) {
    paddedRow = rows;
    rows += 1;
  }

  const zones = mapZones(layout, label, warnings);
  const zoneIds = new Set(zones.map((z) => z.id));

  // 좌석이 하나도 저장되지 않은 오래된 자리표는 모든 자리를 쓰는 것으로 봐요.
  const treatMissingAsActive = webCells.length === 0;
  const cellAt = new Map<string, (typeof webCells)[number]>();
  for (const cell of webCells) {
    const key = `${toInt(cell?.r)}:${toInt(cell?.c)}`;
    if (!cellAt.has(key)) cellAt.set(key, cell);
  }
  const assignmentAt = new Map<string, (typeof assignments)[number]>();
  for (const a of assignments) {
    const key = `${toInt(a?.seat?.r)}:${toInt(a?.seat?.c)}`;
    if (!assignmentAt.has(key)) assignmentAt.set(key, a);
  }

  const placed = new Set<string>();
  const cells: PcCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}:${c}`;
      const web = cellAt.get(key);
      const active =
        r === paddedRow ? false : web ? web.isActive === true : treatMissingAsActive;
      const zoneId =
        active && web?.zoneId && zoneIds.has(web.zoneId) ? web.zoneId : null;
      const a = assignmentAt.get(key);
      const mapped =
        active && typeof a?.studentId === "string"
          ? table.idMap.get(a.studentId)
          : undefined;
      // 명단에서 지워진 학생, 이미 다른 자리에 앉은 학생은 비워 둬요.
      const studentId = mapped && !placed.has(mapped) ? mapped : null;
      if (studentId) placed.add(studentId);
      cells.push({
        r,
        c,
        active,
        zoneId,
        studentId,
        locked: !!studentId && a?.isLocked === true,
      });
    }
  }

  // PC판 크기에 맞추느라 잘린 좌석에 학생이 있었는지 알려 줘요.
  if (resized || droppedOddColumn) {
    let lost = 0;
    for (const a of assignments) {
      const r = toInt(a?.seat?.r);
      const c = toInt(a?.seat?.c);
      const id =
        typeof a?.studentId === "string" ? table.idMap.get(a.studentId) : undefined;
      if (id == null || r == null || c == null) continue;
      const wasShown = cellAt.get(`${r}:${c}`)?.isActive === true || treatMissingAsActive;
      if ((r >= rows || c >= cols) && wasShown && !placed.has(id)) lost++;
    }
    if (resized) {
      warnings.push(
        `${label}: 교실 크기(${webRows}×${webCols})를 PC판에 맞춰 ${rows}×${cols}로 바꿨어요.${lost ? ` 잘린 자리의 학생 ${lost}명은 자리 없이 옮겼어요.` : ""}`
      );
    } else if (lost) {
      warnings.push(
        `${label}: 웹 화면에 보이지 않던 마지막 열을 빼면서 그 자리의 학생 ${lost}명은 자리 없이 옮겼어요.`
      );
    }
  }

  // 지정구역 배정(zoneStudentMapping) → 학생의 zoneId. 학생이 여러 구역에 있으면 처음 것만.
  const studentZone = new Map<string, string>();
  for (const m of Array.isArray(layout.zoneStudentMapping)
    ? layout.zoneStudentMapping
    : []) {
    if (!m || !zoneIds.has(m.zoneId) || !Array.isArray(m.studentIds)) continue;
    for (const webId of m.studentIds) {
      const id = typeof webId === "string" ? table.idMap.get(webId) : undefined;
      if (id && !studentZone.has(id)) studentZone.set(id, m.zoneId);
    }
  }
  // 웹은 고정석 학생에게 지정구역을 적용하지 않아요. PC판은 고정석이 구역 밖이면 배치를 멈추므로
  // 그런 학생은 구역 배정을 풀어 웹과 같게 동작하도록 해요.
  for (const cell of cells) {
    if (!cell.locked || !cell.studentId) continue;
    const zone = studentZone.get(cell.studentId);
    if (zone && zone !== cell.zoneId) studentZone.delete(cell.studentId);
  }

  return {
    students: table.students.map((s) => ({
      ...s,
      zoneId: studentZone.get(s.id) ?? null,
    })),
    rows,
    cols,
    layout: layoutType,
    // PC판은 짝꿍형에서만 성별 짝 옵션을 써요(다른 배치는 random으로 저장).
    pairing: layoutType === "pairs" ? mapPairing(layout.config?.genderOption) : "random",
    zones,
    cells,
    separationPairs: [],
    avoidSeats: { seats: [], studentIds: [] },
  };
}

// ---------- 전체 ----------

export function buildPcExport(input: PcExportInput): PcExportResult {
  const now = input.now ?? new Date();
  const warnings: string[] = [];
  const rosters = (Array.isArray(input.rosters) ? input.rosters : []).filter(
    (r): r is ClassRoster => !!r && typeof r === "object"
  );
  if (rosters.length === 0) return { ok: false, reason: "no-classes" };
  const layouts = (Array.isArray(input.layouts) ? input.layouts : []).filter(
    (l): l is Layout => !!l && typeof l === "object"
  );

  const rosterIds = new Set(rosters.map((r) => r.id));
  const orphanLayouts = layouts.filter((l) => !rosterIds.has(l.classId)).length;
  if (orphanLayouts > 0) {
    warnings.push(
      `삭제된 학급의 저장 배치 ${orphanLayouts}개는 옮기지 않았어요.`
    );
  }

  // 학급별 자리표, 최신순(저장 시각이 없으면 가장 오래된 것으로).
  const byClass = new Map<string, Layout[]>();
  for (const layout of layouts) {
    if (!rosterIds.has(layout.classId)) continue;
    const list = byClass.get(layout.classId) ?? [];
    list.push(layout);
    byClass.set(layout.classId, list);
  }
  byClass.forEach((list) =>
    list.sort((a, b) => (toTime(b.createdAt) ?? 0) - (toTime(a.createdAt) ?? 0))
  );

  // 학급이 30개를 넘으면 최근에 쓴 30개만, 원래 순서를 지켜 담아요.
  const lastUsed = (r: ClassRoster) =>
    Math.max(
      toTime(byClass.get(r.id)?.[0]?.createdAt) ?? 0,
      toTime(r.createdAt) ?? 0
    );
  let selected = rosters;
  if (rosters.length > PC_LIMITS.classes) {
    const keep = new Set(
      [...rosters]
        .sort((a, b) => lastUsed(b) - lastUsed(a))
        .slice(0, PC_LIMITS.classes)
    );
    selected = rosters.filter((r) => keep.has(r));
    const skipped = rosters
      .filter((r) => !keep.has(r))
      .map((r) => clip(r.className, PC_LIMITS.className) || "이름 없는 학급");
    warnings.push(
      `학급이 ${rosters.length}개라 PC판 한도(${PC_LIMITS.classes}개)에 맞춰 최근에 쓴 ${PC_LIMITS.classes}개만 담았어요. 빠진 학급: ${skipped.join(", ")}`
    );
  }

  const usedClassIds = new Set<string>();
  const classes: PcClassroom[] = selected.map((roster, i) => {
    const rawName = typeof roster.className === "string" ? roster.className.trim() : "";
    const name = clip(rawName, PC_LIMITS.className) || `학급 ${i + 1}`;
    const label = `'${name}'`;
    if (rawName.length > PC_LIMITS.className) {
      warnings.push(`${label}: 학급 이름이 ${PC_LIMITS.className}자를 넘어 줄였어요.`);
    }
    const id = uniqueId(roster.id, `class-${i + 1}`, usedClassIds);
    const table = mapStudents(roster, label, warnings);

    const classLayouts = byClass.get(roster.id) ?? [];
    if (classLayouts.length > PC_LIMITS.history) {
      warnings.push(
        `${label}: 저장한 배치가 ${classLayouts.length}개라 최근 ${PC_LIMITS.history}개만 옮겼어요.`
      );
    }
    const usedSnapshotIds = new Set<string>();
    const history: PcSnapshot[] = classLayouts
      .slice(0, PC_LIMITS.history)
      .map((layout, j) => {
        const title =
          clip(layout.title, PC_LIMITS.snapshotTitle) || `${name} 배치 ${j + 1}`;
        return {
          id: uniqueId(layout.id, `layout-${j + 1}`, usedSnapshotIds),
          title,
          createdAt: new Date(toTime(layout.createdAt) ?? now.getTime()).toISOString(),
          workspace: mapWorkspace(layout, table, `${label} '${title}'`, warnings),
        };
      });

    // 가장 최근 자리표를 현재 화면으로. 경고는 기록(history) 쪽에서 이미 남겼어요.
    const workspace = classLayouts.length
      ? mapWorkspace(classLayouts[0], table, label, [])
      : defaultWorkspace(table.students);

    return { id, name, isDemo: false, workspace, history };
  });

  // 가장 최근에 자리표를 저장한 학급을 열어 둬요.
  let active = classes[0];
  let activeTime = -Infinity;
  selected.forEach((roster, i) => {
    const t = toTime(byClass.get(roster.id)?.[0]?.createdAt);
    if (t != null && t > activeTime) {
      activeTime = t;
      active = classes[i];
    }
  });

  return {
    ok: true,
    data: {
      version: 1,
      activeClassId: active.id,
      classes,
      preferences: {
        animation: true,
        sound: true,
        soundVolume: 0.12,
        countdown: false,
        teacherName: clip(input.teacherName, PC_LIMITS.teacherName) || "선생님",
      },
    },
    warnings,
  };
}

/** 내려받을 파일 이름: 어울림-PC판-옮기기-2026-11-02.json (한국 날짜) */
export function pcExportFileName(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `어울림-PC판-옮기기-${kst.toISOString().slice(0, 10)}.json`;
}
