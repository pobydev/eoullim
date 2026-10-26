import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// PC 저장소가 이 컴퓨터에 있으면, 테스트용 스키마 복사본이 원본과 같은지 확인해요.
// (CI처럼 PC 저장소가 없는 곳에서는 건너뛰어요.)
const PC_SCHEMA_PATH =
  process.env.PC_SCHEMA_PATH ?? "C:/Coding Workspaces/어울림/shared/schema.ts";
const MARKER = "// ---- original file below this line ----";

const normalize = (text: string) => text.replace(/\r\n/g, "\n").trim();

describe("PC schema copy", () => {
  it.skipIf(!existsSync(PC_SCHEMA_PATH))("matches the PC app's shared/schema.ts", () => {
    const copy = readFileSync(new URL("./pc-schema.ts", import.meta.url), "utf8");
    const body = copy.slice(copy.indexOf(MARKER) + MARKER.length);
    expect(normalize(body)).toBe(normalize(readFileSync(PC_SCHEMA_PATH, "utf8")));
  });
});
