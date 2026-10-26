// TEST-ONLY COPY of the PC app backup schema. Do not import from app code.
// Source: C:\Coding Workspaces\어울림\shared\schema.ts (eoullim-desktop 1.4.0, PC repo HEAD 0c389b8), copied 2026-10-26.
// tests/pc-schema-sync.test.ts compares this copy with the original whenever the PC repo is on this machine.
// ---- original file below this line ----
import { z } from "zod";

const id = z.string().min(1).max(100);
export const studentSchema = z.object({
  id,
  name: z.string().trim().min(1).max(40),
  number: z.number().int().min(1).max(999),
  gender: z.enum(["M", "F", "U"]),
  zoneId: id.nullable(),
});
const zoneSchema = z.object({
  id,
  name: z.string().trim().min(1).max(24),
  color: z.enum(["sage", "peach", "lilac", "sky", "rose"]),
});
const cellSchema = z.object({
  r: z.number().int().min(0).max(7),
  c: z.number().int().min(0).max(7),
  active: z.boolean(),
  zoneId: id.nullable(),
  studentId: id.nullable(),
  locked: z.boolean(),
});
export const workspaceSchema = z
  .object({
    students: z.array(studentSchema).max(64),
    rows: z.number().int().min(1).max(8),
    cols: z.number().int().min(1).max(8),
    layout: z.enum(["single", "pairs", "groups"]),
    pairing: z.enum(["random", "mixed", "same"]),
    zones: z.array(zoneSchema).max(5),
    cells: z.array(cellSchema).max(64),
    separationPairs: z
      .array(z.object({ first: id, second: id }))
      .max(32)
      .default([]),
    // Private build only: seats some students should avoid when possible.
    avoidSeats: z
      .object({
        seats: z.array(z.string().regex(/^[0-7]:[0-7]$/)).max(64),
        studentIds: z.array(id).max(64),
      })
      .default({ seats: [], studentIds: [] }),
  })
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    const students = new Set(v.students.map((s) => s.id));
    const zones = new Set(v.zones.map((z) => z.id));
    if (students.size !== v.students.length || zones.size !== v.zones.length)
      fail("중복된 식별자가 있습니다.");
    if (new Set(v.students.map((s) => s.number)).size !== v.students.length)
      fail("출석번호가 중복되었습니다.");
    if (v.cells.length !== v.rows * v.cols)
      fail("교실 크기와 좌석 수가 일치하지 않습니다.");
    if (v.layout !== "single" && v.cols % 2 !== 0)
      fail("짝꿍형과 모둠형의 열 수는 짝수여야 합니다.");
    if (v.layout === "groups" && v.rows % 2 !== 0)
      fail("모둠형의 행 수는 짝수여야 합니다.");
    const positions = new Set<string>();
    const assigned = new Set<string>();
    for (const c of v.cells) {
      const key = `${c.r}:${c.c}`;
      if (positions.has(key) || c.r >= v.rows || c.c >= v.cols)
        fail("유효하지 않은 좌석 위치입니다.");
      positions.add(key);
      if (c.zoneId && !zones.has(c.zoneId)) fail("알 수 없는 지정구역입니다.");
      if (!c.active && (c.studentId || c.locked || c.zoneId))
        fail("통로에 배치 정보가 있습니다.");
      if (c.locked && !c.studentId) fail("빈 좌석은 고정할 수 없습니다.");
      if (c.studentId) {
        if (!students.has(c.studentId) || assigned.has(c.studentId))
          fail("중복 또는 알 수 없는 학생 배치입니다.");
        assigned.add(c.studentId);
      }
    }
    for (const s of v.students)
      if (s.zoneId && !zones.has(s.zoneId))
        fail("학생의 지정구역을 찾을 수 없습니다.");
    const pairs = new Set<string>();
    for (const pair of v.separationPairs) {
      const key = [pair.first, pair.second].sort().join(":");
      if (
        pair.first === pair.second ||
        !students.has(pair.first) ||
        !students.has(pair.second) ||
        pairs.has(key)
      )
        fail("학생 간 배치 조건이 올바르지 않습니다.");
      pairs.add(key);
    }
    if (v.avoidSeats.studentIds.some((s) => !students.has(s)))
      fail("피할 자리 대상 학생을 찾을 수 없습니다.");
  });
export const snapshotSchema = z.object({
  id,
  title: z.string().trim().min(1).max(80),
  createdAt: z.string().datetime(),
  workspace: workspaceSchema,
});
export const classroomSchema = z.object({
  id,
  name: z.string().trim().min(1).max(40),
  isDemo: z.boolean(),
  workspace: workspaceSchema,
  history: z.array(snapshotSchema).max(100),
});
export const appDataSchema = z
  .object({
    version: z.literal(1),
    activeClassId: id,
    classes: z.array(classroomSchema).min(1).max(30),
    preferences: z.object({
      animation: z.boolean(),
      sound: z.boolean(),
      soundVolume: z.number().min(0).max(0.3).default(0.12),
      countdown: z.boolean().default(false),
      teacherName: z.string().max(30),
    }),
  })
  .superRefine((v, ctx) => {
    if (
      !v.classes.some((c) => c.id === v.activeClassId) ||
      new Set(v.classes.map((c) => c.id)).size !== v.classes.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "학급 목록이 올바르지 않습니다.",
      });
    }
  });

export type Student = z.infer<typeof studentSchema>;
export type Zone = z.infer<typeof zoneSchema>;
export type Cell = z.infer<typeof cellSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Classroom = z.infer<typeof classroomSchema>;
export type AppData = z.infer<typeof appDataSchema>;
export type LoadResult = {
  data: AppData | null;
  recovered: boolean;
  error?: string;
};
export interface DesktopAPI {
  saveRosterTemplate: () => Promise<boolean>;
  load: () => Promise<LoadResult>;
  save: (data: AppData) => Promise<void>;
  exportBackup: (data: AppData) => Promise<boolean>;
  importBackup: () => Promise<AppData | null>;
  exportPDF: (title: string) => Promise<boolean>;
  print: () => Promise<void>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  fullscreen: (value: boolean) => Promise<void>;
}
