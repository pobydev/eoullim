"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultDisplayName?: string;
  onProfileUpdated?: () => void;
}

export default function ProfileSettingsDialog({
  open,
  onOpenChange,
  userId,
  defaultDisplayName,
  onProfileUpdated,
}: ProfileSettingsDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteAccount } = useAuth();

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profile = await getUserProfile(userId);
      if (profile?.displayName) {
        setDisplayName(profile.displayName);
      } else if (defaultDisplayName) {
        setDisplayName(defaultDisplayName);
      } else {
        setDisplayName("");
      }
      setSchoolName(profile?.schoolName || "");
      setSubject(profile?.subject || "");
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      if (defaultDisplayName) {
        setDisplayName(defaultDisplayName);
      }
      setSchoolName("");
      setSubject("");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const profile: UserProfile = {
        displayName: displayName.trim() || undefined,
        schoolName: schoolName.trim() || undefined,
        subject: subject.trim() || undefined,
      };
      await saveUserProfile(userId, profile);
      console.log("프로필 저장됨:", profile);
      // 프로필 업데이트 콜백 호출
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로필 설정</DialogTitle>
          <DialogDescription>
            앱 내에서 표시될 정보를 설정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">표시 이름</Label>
            <Input
              id="displayName"
              placeholder={defaultDisplayName || "이름을 입력하세요"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading || saving}
            />
            <p className="text-xs text-gray-500">
              비워두면 구글 계정 이름이 표시됩니다.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolName">학교 이름 (선택사항)</Label>
            <Input
              id="schoolName"
              placeholder="학교 이름을 입력하세요"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">과목 (선택사항)</Label>
            <Input
              id="subject"
              placeholder="담당 과목을 입력하세요"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={saving || loading}
              className="mr-auto"
            >
              계정 삭제
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 학급과 저장된 자리표가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deleteAccount();
                } catch (error) {
                  console.error("계정 삭제 실패:", error);
                  alert("계정 삭제에 실패했습니다. 다시 시도해주세요.");
                  setIsDeleting(false);
                  setIsDeleteDialogOpen(false);
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

