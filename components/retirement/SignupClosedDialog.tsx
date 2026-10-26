"use client";

import { useAuth } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PC_DOWNLOAD_URL,
  SERVICE_END_DATE,
  SIGNUP_BLOCK_DATE,
  formatKoreanDate,
} from "@/lib/retirement";
import { MonitorDown } from "lucide-react";

/** 새 가입이 막혔을 때(또는 확인하지 못했을 때) 어느 화면에서든 한 번 보여주는 안내 창 */
export default function SignupClosedDialog() {
  const { signupNotice, clearSignupNotice } = useAuth();
  const closed = signupNotice === "closed";

  return (
    <AlertDialog
      open={signupNotice !== null}
      onOpenChange={(open) => {
        if (!open) clearSignupNotice();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {closed ? "새로운 가입은 받지 않고 있어요" : "로그인을 마치지 못했어요"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {closed ? (
              <div className="space-y-2 text-left leading-relaxed">
                <p>
                  어울림 웹 서비스는 {formatKoreanDate(SERVICE_END_DATE)}에 종료될
                  예정이라 {formatKoreanDate(SIGNUP_BLOCK_DATE)}부터 새로 가입할 수
                  없어요.
                </p>
                <p>
                  대신 Windows용 PC 프로그램을 내려받으면 바로 쓸 수 있어요. PC판은
                  학생 정보를 선생님 PC에만 저장해요.
                </p>
                <p>
                  이미 웹 어울림을 쓰고 계셨다면, 처음 가입할 때 쓴 방법(Google·네이버·카카오)으로
                  다시 로그인해 주세요.
                </p>
              </div>
            ) : (
              <p className="text-left">
                계정 정보를 확인하는 중에 문제가 생겼어요. 인터넷 연결을 확인한 뒤 다시
                로그인해 주세요.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {closed && (
            <a
              href={PC_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default" })}
            >
              <MonitorDown className="mr-2 h-4 w-4" />
              PC판 내려받기
            </a>
          )}
          <AlertDialogAction
            className={
              closed
                ? cn(buttonVariants({ variant: "outline" }), "text-foreground")
                : undefined
            }
            onClick={clearSignupNotice}
          >
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
