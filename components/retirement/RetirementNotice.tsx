"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ChevronDown, ChevronUp, FileDown, Info, Loader2, MonitorDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DATA_DELETION_DATE,
  PC_DOWNLOAD_URL,
  SERVICE_END_DATE,
  SIGNUP_BLOCK_DATE,
  daysUntilServiceEnd,
  formatKoreanDate,
  getRetirementPhase,
  isSignupBlocked,
} from "@/lib/retirement";

type Variant = "landing" | "dashboard" | "help";

const COLLAPSE_KEY = "eoullim-retirement-notice-collapsed";
const END = formatKoreanDate(SERVICE_END_DATE);
const DELETION = formatKoreanDate(DATA_DELETION_DATE);
const MAX_WARNINGS_SHOWN = 8;

type ExportOutcome =
  | { kind: "done"; fileName: string; warnings: string[] }
  | { kind: "empty" }
  | { kind: "error" };

function downloadJson(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function usePcExport(user: User | null) {
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ExportOutcome | null>(null);

  const run = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const [{ getClassRosters, getLayouts, getUserProfile }, { buildPcExport, pcExportFileName }] =
        await Promise.all([import("@/lib/firestore"), import("@/lib/pc-export")]);
      const [rosters, layouts, profile] = await Promise.all([
        getClassRosters(user.uid),
        getLayouts(user.uid),
        getUserProfile(user.uid).catch(() => null),
      ]);
      const result = buildPcExport({
        rosters,
        layouts,
        teacherName: profile?.displayName || user.displayName,
      });
      if (!result.ok) {
        setOutcome({ kind: "empty" });
        return;
      }
      const fileName = pcExportFileName();
      downloadJson(result.data, fileName);
      setOutcome({ kind: "done", fileName, warnings: result.warnings });
    } catch (error) {
      console.error("PC판으로 옮길 파일 만들기 실패:", error);
      setOutcome({ kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  return { busy, outcome, run, close: () => setOutcome(null) };
}

/** 서버에서 미리 그린 화면과 어긋나지 않도록, 날짜는 브라우저에서만 읽어요. */
function useClientNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

function ExportResultDialog({
  outcome,
  onClose,
}: {
  outcome: ExportOutcome | null;
  onClose: () => void;
}) {
  const warnings = outcome?.kind === "done" ? outcome.warnings : [];
  return (
    <Dialog open={outcome !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {outcome?.kind === "done"
              ? "PC판으로 옮길 파일을 내려받았어요"
              : outcome?.kind === "empty"
                ? "옮길 학급이 없어요"
                : "파일을 만들지 못했어요"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-left text-sm leading-relaxed text-gray-600">
              {outcome?.kind === "done" && (
                <>
                  <p>
                    PC판 어울림에서 <strong>앱 설정 → 백업 불러오기</strong>를 누르고
                    이 파일을 고른 뒤 <strong>학급으로 추가</strong>를 선택해 주세요.
                    PC판에 있던 학급은 그대로 두고, 웹의 학급과 저장한 배치가 옆에
                    더해져요.
                  </p>
                  <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    파일 이름: {outcome.fileName}
                    <br />
                    파일에는 학생 이름이 들어 있어요. 옮긴 뒤에는 파일을 지우거나 안전한
                    곳에 보관해 주세요.
                  </p>
                </>
              )}
              {outcome?.kind === "empty" && (
                <p>
                  웹에 저장된 학급이 없어요. PC판을 내려받아 새로 시작하면 돼요.
                </p>
              )}
              {outcome?.kind === "error" && (
                <p>인터넷 연결을 확인한 뒤 다시 시도해 주세요.</p>
              )}
              {warnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  <p className="mb-1 font-medium">
                    PC판 형식에 맞추느라 조금 바꾼 부분이 있어요.
                  </p>
                  <ul className="list-disc space-y-0.5 pl-5 text-xs">
                    {warnings.slice(0, MAX_WARNINGS_SHOWN).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {warnings.length > MAX_WARNINGS_SHOWN && (
                      <li>그 밖에 {warnings.length - MAX_WARNINGS_SHOWN}건</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          {outcome?.kind !== "error" && (
            <a
              href={PC_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <MonitorDown className="mr-2 h-4 w-4" />
              PC판 내려받기
            </a>
          )}
          <Button onClick={onClose}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 웹 서비스 종료 안내. 첫 화면·대시보드·도움말에 같은 내용을 보여줘요.
 * 대시보드에서는 접을 수 있지만, 접은 상태는 이번 브라우저 세션 동안만 기억해요.
 */
export default function RetirementNotice({ variant }: { variant: Variant }) {
  const { user } = useAuth();
  const now = useClientNow();
  const phase = now ? getRetirementPhase(now) : "notice";
  const daysLeft = now ? daysUntilServiceEnd(now) : null;
  const collapsible = variant === "dashboard";
  const [collapsed, setCollapsed] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const exporter = usePcExport(user);

  useEffect(() => {
    if (collapsible && sessionStorage.getItem(COLLAPSE_KEY) === "1") {
      setCollapsed(true);
    }
  }, [collapsible]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (next) sessionStorage.setItem(COLLAPSE_KEY, "1");
    else sessionStorage.removeItem(COLLAPSE_KEY);
  };

  const onExportClick = () => {
    if (user) void exporter.run();
    else setShowLoginHint((v) => !v);
  };

  const ended = phase === "ended";
  const countdown =
    phase === "reminder" && daysLeft !== null
      ? daysLeft === 0
        ? " 오늘이 마지막 날이에요."
        : ` 종료까지 ${daysLeft}일 남았어요.`
      : "";
  const compact = variant === "dashboard";

  const buttons = (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={PC_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ size: compact ? "sm" : "default" })}
      >
        <MonitorDown className="mr-2 h-4 w-4" />
        PC판 내려받기
      </a>
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={onExportClick}
        disabled={exporter.busy}
      >
        {exporter.busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        {exporter.busy ? "파일 만드는 중..." : "PC판으로 옮길 파일 내려받기"}
      </Button>
    </div>
  );

  const loginHint = showLoginHint && !user && (
    <p className="text-sm text-sky-800">
      옮길 파일은 로그인한 뒤에 내려받을 수 있어요. 평소처럼 로그인하면 대시보드 위쪽
      안내에서 같은 버튼을 눌러 주세요.
    </p>
  );

  const details = (
    <div className="space-y-1.5 text-sm leading-relaxed text-gray-700">
      {ended ? (
        <>
          <p>
            어울림 웹 서비스는 <strong>{END}</strong>에 종료되었어요. 그동안 써 주셔서
            고마워요.
          </p>
          <p>
            웹에 남아 있는 학급과 자리 배치는 <strong>{DELETION}</strong>에 모두
            삭제돼요. 그 전에 옮길 파일을 내려받아 PC판에서 불러와 주세요.
          </p>
        </>
      ) : (
        <>
          <p>
            웹 서비스는 <strong>{END}</strong>에 종료되고, Windows용 PC 프로그램으로
            옮겨 가요. 이번 학년도 끝까지는 지금처럼 그대로 쓸 수 있어요.
            {countdown && <strong>{countdown}</strong>}
          </p>
          <p>
            PC판은 학생 정보를 인터넷 서버가 아닌 선생님 PC에만 저장해서, 개인정보를
            더 안전하게 지킬 수 있어요.
          </p>
          <p>
            웹에 저장된 학급과 자리 배치는 <strong>{DELETION}</strong>에 모두 삭제돼요.
            그 전에 <strong>[PC판으로 옮길 파일 내려받기]</strong>로 파일을 받아 PC판의{" "}
            <strong>[백업 불러오기]</strong>에서 열어 주세요.
          </p>
        </>
      )}
      {variant === "landing" && now && isSignupBlocked(now) && (
        <p>
          {formatKoreanDate(SIGNUP_BLOCK_DATE)}부터 새로운 가입은 받지 않아요. 처음
          쓰시는 선생님은 PC판을 내려받아 바로 시작해 주세요.
        </p>
      )}
    </div>
  );

  const title = ended
    ? "어울림 웹 서비스가 종료되었어요"
    : "어울림이 PC 프로그램(Windows)으로 옮겨 가요";

  const dialog = (
    <ExportResultDialog outcome={exporter.outcome} onClose={exporter.close} />
  );

  if (variant === "dashboard") {
    return (
      <section
        aria-label="웹 서비스 종료 안내"
        className="border-b border-sky-200 bg-sky-50 px-4 py-2 print:hidden"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Info className="h-4 w-4 flex-shrink-0 text-sky-600" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-medium text-sky-900">
            {collapsed
              ? ended
                ? `웹 서비스는 ${END}에 종료되었어요. 데이터는 ${DELETION}에 삭제돼요.`
                : `웹 서비스는 ${END}에 종료되고 PC 프로그램으로 옮겨 가요.${countdown}`
              : title}
          </p>
          {collapsed && buttons}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-sky-700 hover:bg-sky-100"
          >
            {collapsed ? (
              <>
                자세히 <ChevronDown className="h-4 w-4" aria-hidden />
              </>
            ) : (
              <>
                접기 <ChevronUp className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
        {!collapsed && (
          <div className="space-y-3 pb-2 pl-7 pt-2">
            {details}
            {buttons}
          </div>
        )}
        {dialog}
      </section>
    );
  }

  return (
    <section
      aria-label="웹 서비스 종료 안내"
      className={cn(
        "w-full rounded-2xl border border-sky-200 bg-white/90 p-5 text-left shadow-sm print:hidden",
        variant === "landing" && "max-w-2xl backdrop-blur-sm"
      )}
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {details}
          {buttons}
          {loginHint}
        </div>
      </div>
      {dialog}
    </section>
  );
}
