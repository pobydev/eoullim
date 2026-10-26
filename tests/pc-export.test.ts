import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import type { ClassRoster, Layout, Student, Zone } from "../types";
import {
  buildPcExport,
  pcExportFileName,
  type PcAppData,
  type PcCell,
  type PcWorkspace,
} from "../lib/pc-export";
import { appDataSchema } from "./pc-schema";
import {
  FIXED_NOW,
  grid,
  layout,
  sampleInput,
  seats,
  students,
} from "./fixtures/web-data";

function exportOk(input: Parameters<typeof buildPcExport>[0]) {
  const result = buildPcExport(input);
  if (!result.ok) throw new Error(`export failed: ${result.reason}`);
  return result;
}

/** PC판 실제 스키마(복사본)로 검사하고, 실패하면 어떤 항목이 틀렸는지 보여줘요. */
function expectValid(data: PcAppData) {
  const parsed = appDataSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.issues.slice(0, 5), null, 2));
  }
  // 기본값(default)에 기대지 않고, 파싱 전후가 같아야 해요.
  expect(parsed.data).toEqual(data);
}

const cellAt = (w: PcWorkspace, r: number, c: number): PcCell => {
  const cell = w.cells.find((x) => x.r === r && x.c === c);
  if (!cell) throw new Error(`no cell ${r}:${c}`);
  return cell;
};
const classById = (data: PcAppData, id: string) => {
  const found = data.classes.find((c) => c.id === id);
  if (!found) throw new Error(`no class ${id}`);
  return found;
};

describe("buildPcExport — sample fixtures", () => {
  const { data, warnings } = exportOk(sampleInput());

  it("passes the PC app's appDataSchema", () => {
    expectValid(data);
    expect(data.version).toBe(1);
    expect(data.classes).toHaveLength(4);
    expect(data.classes.every((c) => c.isDemo === false)).toBe(true);
    expect(data.preferences).toEqual({
      animation: true,
      sound: true,
      soundVolume: 0.12,
      countdown: false,
      teacherName: "가상 선생님",
    });
  });

  it("opens the class whose layout was saved most recently", () => {
    expect(data.activeClassId).toBe("roster-groups");
  });

  it("maps 기본형 to single with inactive cells as aisles", () => {
    const cls = classById(data, "roster-basic");
    const w = cls.workspace;
    expect(cls.name).toBe("가상 1반");
    expect([w.layout, w.rows, w.cols, w.cells.length]).toEqual(["single", 2, 4, 8]);
    // 기본형에서는 성별 짝 옵션을 쓰지 않아요.
    expect(w.pairing).toBe("random");
    expect(cellAt(w, 1, 3)).toEqual({
      r: 1, c: 3, active: false, zoneId: null, studentId: null, locked: false,
    });
    expect(cellAt(w, 0, 0).studentId).toBe("a1");
    expect(w.students.map((s) => s.gender)).toEqual(["M", "F", "M", "F", "M", "U"]);
    expect(w.students.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(cls.history.map((h) => h.title)).toEqual(["1반 3월 배치"]);
    expect(cls.history[0].createdAt).toBe("2026-03-02T00:00:00.000Z");
  });

  it("maps 분단형 to pairs, keeping column pairs (0,1),(2,3),(4,5)", () => {
    const cls = classById(data, "roster-pairs");
    const w = cls.workspace;
    expect(cls.name).toBe("가상 2반");
    expect([w.layout, w.pairing, w.rows, w.cols]).toEqual(["pairs", "same", 2, 6]);
    // 최신 자리표가 현재 화면, 기록은 최신순
    expect(cls.history.map((h) => h.id)).toEqual(["layout-pairs-new", "layout-pairs-old"]);
    expect(cls.history[1].workspace.pairing).toBe("random");
    expect(cellAt(w, 0, 0)).toMatchObject({ studentId: "b1", locked: true });
    expect(cellAt(w, 0, 1)).toMatchObject({ studentId: "b2", locked: false });
  });

  it("drops deleted students, duplicate placements and empty locks", () => {
    const w = classById(data, "roster-pairs").workspace;
    expect(cellAt(w, 0, 5).studentId).toBeNull(); // 지워진 학생
    expect(cellAt(w, 1, 3).studentId).toBeNull(); // b2가 두 번 → 두 번째 비움
    expect(cellAt(w, 1, 4)).toMatchObject({ studentId: null, locked: false });
    expect(cellAt(w, 1, 5)).toEqual({
      r: 1, c: 5, active: false, zoneId: null, studentId: null, locked: false,
    });
    const placed = w.cells.map((c) => c.studentId).filter(Boolean);
    expect(new Set(placed).size).toBe(placed.length);
  });

  it("maps 모둠형(4인) to groups with zones, colors and zone students", () => {
    const w = classById(data, "roster-groups").workspace;
    expect([w.layout, w.pairing, w.rows, w.cols]).toEqual(["groups", "random", 6, 6]);
    expect(w.zones.map((z) => [z.id, z.color])).toEqual([
      ["zone-front", "sage"],
      ["zone-window", "peach"],
      // orange도 peach지만 이미 쓰였으니 PC판처럼 남은 색을 골라요
      ["zone-back", "lilac"],
    ]);
    expect(w.zones[1].name.length).toBeLessThanOrEqual(24);
    expect(cellAt(w, 0, 0)).toMatchObject({ zoneId: "zone-front", studentId: "c1", locked: true });
    expect(cellAt(w, 0, 5).zoneId).toBeNull(); // 없는 구역
    expect(cellAt(w, 2, 0)).toMatchObject({ active: false, zoneId: null });
    const zoneOf = Object.fromEntries(w.students.map((s) => [s.id, s.zoneId]));
    expect(zoneOf).toMatchObject({
      c1: "zone-front",
      c2: "zone-front",
      c3: "zone-front",
      c4: null, // 구역 밖 고정석 → 웹처럼 고정이 우선
      c5: "zone-window",
      c7: null, // 없는 구역 매핑
    });
  });

  it("renumbers missing/duplicate attendance numbers without collisions", () => {
    const w = classById(data, "roster-nolayout").workspace;
    expect(w.students.map((s) => s.number)).toEqual([1, 6, 7, 5, 8]);
    expect(w.students[1].name).toBe("가상학생D02");
    expect(warnings.some((m) => m.includes("'가상 4반'") && m.includes("3명"))).toBe(true);
  });

  it("builds a default single workspace for a roster without layouts", () => {
    const cls = classById(data, "roster-nolayout");
    const w = cls.workspace;
    expect(cls.history).toEqual([]);
    expect([w.layout, w.rows, w.cols]).toEqual(["single", 2, 3]);
    expect(w.cells.every((c) => c.active && !c.studentId && !c.locked && !c.zoneId)).toBe(true);
    expect(w.cells.length).toBeGreaterThanOrEqual(w.students.length);
  });

  it("warns about layouts of deleted classes", () => {
    expect(warnings).toContain("삭제된 학급의 저장 배치 1개는 옮기지 않았어요.");
  });

  it("can write a sample file for the PC side (PC_EXPORT_SAMPLE_OUT)", () => {
    const out = process.env.PC_EXPORT_SAMPLE_OUT;
    if (!out) return;
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(data, null, 2) + "\n", "utf8");
  });
});

describe("buildPcExport — layout shape adjustments", () => {
  const roster = (n: number, id = "r1"): ClassRoster => ({
    id,
    className: `가상반 ${id}`,
    students: students(`${id}s`, Array.from({ length: n }, (_, i) => (i % 2 ? "F" : "M"))),
  });

  it("drops the odd trailing column of 분단형 that the web never drew", () => {
    const r = roster(5);
    const cells = grid(1, 5);
    const l = layout("l1", "r1", "홀수 열", { rows: 1, cols: 5, layoutType: "분단형" }, cells,
      seats(cells, { "0:0": "r1s1", "0:4": "r1s5" }), { createdAt: FIXED_NOW });
    const { data, warnings } = exportOk({ rosters: [r], layouts: [l] });
    expectValid(data);
    const w = data.classes[0].workspace;
    expect([w.layout, w.cols, w.cells.length]).toEqual(["pairs", 4, 4]);
    expect(w.cells.some((c) => c.studentId === "r1s5")).toBe(false);
    expect(warnings.join("\n")).toContain("1명");
  });

  it("pads an odd-row 모둠형 with an aisle row so every seat survives", () => {
    const r = roster(4);
    const cells = grid(7, 6);
    const l = layout("l1", "r1", "7행 모둠", { rows: 7, cols: 6, layoutType: "모둠형(4인)" }, cells,
      seats(cells, { "6:5": "r1s1" }), { createdAt: FIXED_NOW });
    const { data } = exportOk({ rosters: [r], layouts: [l] });
    expectValid(data);
    const w = data.classes[0].workspace;
    expect([w.layout, w.rows, w.cols]).toEqual(["groups", 8, 6]);
    expect(cellAt(w, 6, 5).studentId).toBe("r1s1");
    expect(w.cells.filter((c) => c.r === 7).every((c) => !c.active)).toBe(true);
  });

  it("clamps more than 64 students and grids larger than 8×8 with warnings", () => {
    const r = roster(70);
    const cells = grid(10, 10);
    const placed: Record<string, string> = {};
    r.students.forEach((s, i) => (placed[`${Math.floor(i / 10)}:${i % 10}`] = s.id));
    const l = layout("l1", "r1", "큰 교실", { rows: 10, cols: 10, layoutType: "기본형" }, cells,
      seats(cells, placed), { createdAt: FIXED_NOW });
    const { data, warnings } = exportOk({ rosters: [r], layouts: [l] });
    expectValid(data);
    const w = data.classes[0].workspace;
    expect(w.students).toHaveLength(64);
    expect([w.rows, w.cols, w.cells.length]).toEqual([8, 8, 64]);
    expect(warnings.some((m) => m.includes("64명"))).toBe(true);
    expect(warnings.some((m) => m.includes("10×10") && m.includes("8×8"))).toBe(true);
  });

  it("keeps at most 5 zones and never repeats a color", () => {
    const r = roster(2);
    const zones: Zone[] = ["lime", "yellow", "rose", "violet", "orange", "lime"].map(
      (color, i) => ({ id: `z${i}`, name: `구역${i}`, color })
    );
    const cells = grid(2, 3, { "0:0": { zoneId: "z5" }, "0:1": { zoneId: "z4" } });
    const l = layout("l1", "r1", "구역 6개", { rows: 2, cols: 3, zones }, cells, seats(cells, {}),
      { createdAt: FIXED_NOW });
    const { data, warnings } = exportOk({ rosters: [r], layouts: [l] });
    expectValid(data);
    const w = data.classes[0].workspace;
    expect(w.zones.map((z) => z.color)).toEqual(["sage", "peach", "rose", "lilac", "sky"]);
    expect(cellAt(w, 0, 0).zoneId).toBeNull(); // 6번째 구역은 빠짐
    expect(cellAt(w, 0, 1).zoneId).toBe("z4");
    expect(warnings.some((m) => m.includes("지정구역이 6개"))).toBe(true);
  });

  it("keeps the 30 most recently used classes in original order", () => {
    const rosters = Array.from({ length: 31 }, (_, i) => ({
      ...roster(1, `r${i}`),
      createdAt: new Date(Date.UTC(2026, 0, 1 + i)),
    }));
    const layouts: Layout[] = [
      layout("old", "r30", "가장 최근 배치", { rows: 1, cols: 1 }, grid(1, 1), [], {
        createdAt: new Date("2026-09-01T00:00:00Z"),
      }),
    ];
    const { data, warnings } = exportOk({ rosters, layouts });
    expectValid(data);
    expect(data.classes).toHaveLength(30);
    expect(data.classes.map((c) => c.id)).not.toContain("r0"); // 가장 오래 안 쓴 반
    expect(data.classes.at(-1)?.id).toBe("r30");
    expect(data.activeClassId).toBe("r30");
    expect(warnings.some((m) => m.includes("가상반 r0"))).toBe(true);
  });

  it("uses `now` for layouts without a saved time and fills empty titles", () => {
    const r = roster(1);
    const l = layout("l1", "r1", "   ", { rows: 1, cols: 1 }, grid(1, 1), []);
    const { data } = exportOk({ rosters: [r], layouts: [l], now: FIXED_NOW });
    expectValid(data);
    expect(data.classes[0].history[0]).toMatchObject({
      createdAt: FIXED_NOW.toISOString(),
      title: "가상반 r1 배치 1",
    });
    expect(data.preferences.teacherName).toBe("선생님");
  });

  it("reports when there is nothing to export", () => {
    expect(buildPcExport({ rosters: [], layouts: [] })).toEqual({ ok: false, reason: "no-classes" });
  });

  it("names the download with the Korean date", () => {
    expect(pcExportFileName(new Date("2026-11-01T16:30:00Z"))).toBe("어울림-PC판-옮기기-2026-11-02.json");
  });
});

// 이상한 데이터가 와도 항상 PC판 스키마를 통과하는지 무작위로 확인해요(시드 고정).
describe("buildPcExport — randomized robustness", () => {
  function rng(seed: number) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("always produces schema-valid data", () => {
    const rand = rng(20261102);
    const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
    const pick = <T,>(list: readonly T[]): T => list[int(0, list.length - 1)];
    const longText = "가".repeat(120);

    for (let iter = 0; iter < 250; iter++) {
      const rosters: ClassRoster[] = Array.from({ length: int(1, 5) }, (_, ri) => {
        const n = int(0, 70);
        const list: Student[] = Array.from({ length: n }, (_, si) => ({
          id: pick([`s${ri}-${si}`, `s${ri}-${si}`, `s${ri}-0`, "", longText]),
          name: pick([`가상${si}`, "  ", longText, ` 가상 ${si} `, "😀".repeat(30)]),
          gender: pick(["M", "F", undefined, "X" as unknown as "M"]),
          attendanceNumber: pick([si + 1, si + 1, 1, 0, -3, 1000, 2.5, undefined,
            "7" as unknown as number]),
        }));
        return { id: pick([`roster-${ri}`, `roster-${ri}`, "roster-0", ""]),
          className: pick([`가상 ${ri}반`, "", longText]), students: list };
      });
      const layouts: Layout[] = Array.from({ length: int(0, 6) }, (_, li) => {
        const rows = int(0, 10);
        const cols = int(0, 10);
        const zones: Zone[] = Array.from({ length: int(0, 7) }, (_, zi) => ({
          id: pick([`z${zi}`, `z${zi}`, "z0", ""]),
          name: pick(["앞", "", longText]),
          color: pick(["lime", "yellow", "rose", "violet", "orange", "blue"]),
        }));
        const roster = pick(rosters);
        const ids = [...roster.students.map((s) => s.id), "deleted", null];
        const cells = grid(rows, cols).filter(() => rand() > 0.05).map((c) => ({
          ...c,
          isActive: rand() > 0.2,
          zoneId: rand() > 0.6 ? pick([...zones.map((z) => z.id), "nope"]) : null,
        }));
        const currentAssignment = cells.map((c) => ({
          seat: { r: c.r + (rand() > 0.95 ? 3 : 0), c: c.c },
          studentId: pick(ids),
          isLocked: rand() > 0.7,
        }));
        return layout(`layout-${li}`, pick([roster.id, "gone"]), pick(["배치", "", longText]),
          {
            rows, cols, zones,
            layoutType: pick(["기본형", "분단형", "모둠형(4인)", undefined]),
            genderOption: pick(["랜덤", "남녀 짝", "동성 짝", undefined]),
          },
          cells, currentAssignment,
          {
            createdAt: pick([new Date(Date.UTC(2026, int(0, 11), int(1, 28))), undefined,
              new Date("invalid")]),
            zoneStudentMapping: zones.map((z) => ({
              zoneId: z.id,
              studentIds: roster.students.filter(() => rand() > 0.7).map((s) => s.id),
            })),
          });
      });
      const result = buildPcExport({ rosters, layouts, teacherName: pick(["", longText, "가상"]),
        now: FIXED_NOW });
      if (!result.ok) throw new Error("unexpected no-classes");
      const parsed = appDataSchema.safeParse(result.data);
      if (!parsed.success) {
        throw new Error(`iteration ${iter}: ${JSON.stringify(parsed.error.issues.slice(0, 3))}`);
      }
    }
  });
});
