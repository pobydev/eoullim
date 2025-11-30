"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassRoster, Layout, SeatAssignment, UserProfile } from "@/types";
import {
  getClassRosters,
  getLayouts,
  deleteClassRoster,
  deleteLayout,
  saveClassRoster,
  getUserProfile,
} from "@/lib/firestore";
import RosterManager from "./RosterManager";
import LayoutList from "./LayoutList";
import { LogOut, Settings, HelpCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileSettingsDialog from "./ProfileSettingsDialog";

interface SidebarProps {
  selectedRoster: ClassRoster | null;
  onSelectRoster: (roster: ClassRoster | null) => void;
  selectedLayout: Layout | null;
  onSelectLayout: (layout: Layout | null) => void;
  onLogout: () => void;
  assignments?: SeatAssignment[];
  layoutRefreshKey?: number;
  isAnimating?: boolean;
}

export default function Sidebar({
  selectedRoster,
  onSelectRoster,
  selectedLayout,
  onSelectLayout,
  onLogout,
  assignments = [],
  layoutRefreshKey,
  isAnimating = false,
}: SidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [rosters, setRosters] = useState<ClassRoster[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
      loadUserProfile();
      // 사용자가 변경되면 이미지 에러 상태 초기화
      setImageError(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      setUserProfile(null);
    }
  };

  // layoutRefreshKey가 변경될 때 목록 새로고침
  useEffect(() => {
    if (user && layoutRefreshKey !== undefined && layoutRefreshKey > 0) {
      loadData();
    }
  }, [layoutRefreshKey]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [rosterData, layoutData] = await Promise.all([
        getClassRosters(user.uid),
        getLayouts(user.uid),
      ]);
      setRosters(rosterData);
      setLayouts(layoutData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // layoutRefreshKey가 변경될 때 목록 새로고침
  useEffect(() => {
    if (user && layoutRefreshKey !== undefined && layoutRefreshKey > 0) {
      loadData();
    }
  }, [layoutRefreshKey]);

  const handleDeleteRoster = async (rosterId: string) => {
    if (!user) return;
    try {
      await deleteClassRoster(user.uid, rosterId);
      setRosters(rosters.filter((r) => r.id !== rosterId));
      if (selectedRoster?.id === rosterId) {
        onSelectRoster(null);
      }
    } catch (error) {
      console.error("학급 삭제 실패:", error);
    }
  };

  const handleDeleteLayout = async (layoutId: string) => {
    if (!user) return;
    try {
      await deleteLayout(user.uid, layoutId);
      // 상태 업데이트를 함수형으로 변경하여 최신 상태 사용
      setLayouts((prevLayouts) => prevLayouts.filter((l) => l.id !== layoutId));
      if (selectedLayout?.id === layoutId) {
        onSelectLayout(null);
      }
    } catch (error) {
      console.error("자리표 삭제 실패:", error);
    }
  };

  return (
    <div className="w-80 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm overflow-hidden">
      {/* 로고 섹션 */}
      <div 
        className="p-4 border-b border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)] bg-gradient-to-br from-sky-50 via-white to-blue-50 cursor-pointer hover:bg-gradient-to-br hover:from-sky-100 hover:via-white hover:to-blue-100 transition-colors"
        onClick={() => {
          // 선택된 학급과 레이아웃 초기화 (새로고침 효과)
          onSelectRoster(null);
          onSelectLayout(null);
          router.refresh();
        }}
      >
        <div className="flex flex-col items-center justify-center space-y-1.5">
          <img src="/logo.png" alt="어울림" className="max-h-[100px] w-auto object-contain" />
          <p 
            className="text-sm text-gray-600 text-center leading-relaxed flex flex-col"
            style={{ fontFamily: '"학교안심 받아쓰기체", sans-serif' }}
          >
            <span>"자리에서 시작되는</span>
            <span>우리 반의 새로운 이야기"</span>
          </p>
        </div>
      </div>

      {/* 사용자 정보 섹션 */}
      {user && (
        <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-sm">
                {user.photoURL && !imageError ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "사용자"}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <span className="text-xs font-medium text-sky-600">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || user.displayName || user.email || "사용자"}
                </p>
                {(userProfile?.schoolName || userProfile?.subject) && (
                  <p className="text-xs text-gray-500 truncate">
                    {[userProfile?.schoolName, userProfile?.subject].filter(Boolean).join(" · ")}
                  </p>
                )}
                {user.email && (userProfile?.displayName || user.displayName) && !userProfile?.schoolName && !userProfile?.subject && (
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileDialogOpen(true)}
                className="flex-shrink-0"
                title="프로필 설정"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout} className="flex-shrink-0" title="로그아웃">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="rosters" className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsList className="mx-4 mt-4 flex-shrink-0">
          <TabsTrigger value="rosters" className="flex-1">
            학급 관리
          </TabsTrigger>
          <TabsTrigger value="layouts" className="flex-1">
            저장 목록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rosters" className="flex-1 overflow-hidden px-4 pb-4 min-h-0">
          <RosterManager
            rosters={rosters}
            selectedRoster={selectedRoster}
            onSelectRoster={onSelectRoster}
            onDeleteRoster={handleDeleteRoster}
            onRosterSaved={loadData}
            assignments={assignments}
            isAnimating={isAnimating}
            onRosterUpdate={async (updatedRoster) => {
              if (user) {
                try {
                  await saveClassRoster(user.uid, updatedRoster);
                  await loadData();
                  onSelectRoster(updatedRoster);
                } catch (error) {
                  console.error("학급 업데이트 실패:", error);
                }
              }
            }}
          />
        </TabsContent>

        <TabsContent value="layouts" className="flex-1 overflow-hidden px-4 pb-4 min-h-0">
          <LayoutList
            layouts={
              selectedRoster
                ? layouts.filter((layout) => layout.classId === selectedRoster.id)
                : []
            }
            selectedLayout={selectedLayout}
            onSelectLayout={onSelectLayout}
            onDeleteLayout={handleDeleteLayout}
          />
        </TabsContent>
      </Tabs>

      {/* 네비게이션 섹션 - 게시판 및 도움말 */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 flex-shrink-0">
        <div className="flex gap-2">
          <Link href="/board" className="flex-1">
            <Button variant="outline" className="w-full justify-center" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              게시판
            </Button>
          </Link>
          <Link href="/help" className="flex-1">
            <Button variant="outline" className="w-full justify-center" size="sm">
              <HelpCircle className="mr-2 h-4 w-4" />
              도움말
            </Button>
          </Link>
        </div>
      </div>

      {user && (
        <ProfileSettingsDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
          userId={user.uid}
          defaultDisplayName={user.displayName || undefined}
          onProfileUpdated={loadUserProfile}
        />
      )}
    </div>
  );
}

