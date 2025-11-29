"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Sidebar from "./Sidebar";
import MainWorkspace from "./MainWorkspace";
import { ClassRoster, Layout, SeatAssignment } from "@/types";
import { saveClassRoster } from "@/lib/firestore";

export default function DashboardContent() {
  const { user, logout } = useAuth();
  const [selectedRoster, setSelectedRoster] = useState<ClassRoster | null>(
    null
  );
  const [selectedLayout, setSelectedLayout] = useState<Layout | null>(null);
  const [assignments, setAssignments] = useState<SeatAssignment[]>([]);
  const [layoutRefreshKey, setLayoutRefreshKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRosterUpdate = async (updatedRoster: ClassRoster) => {
    if (!user) return;
    try {
      await saveClassRoster(user.uid, updatedRoster);
      setSelectedRoster(updatedRoster);
    } catch (error) {
      console.error("학급 업데이트 실패:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        selectedRoster={selectedRoster}
        onSelectRoster={setSelectedRoster}
        selectedLayout={selectedLayout}
        onSelectLayout={setSelectedLayout}
        onLogout={logout}
        assignments={assignments}
        layoutRefreshKey={layoutRefreshKey}
        isAnimating={isAnimating}
      />
      <MainWorkspace
        selectedRoster={selectedRoster}
        selectedLayout={selectedLayout}
        onSelectLayout={setSelectedLayout}
        onRosterUpdate={handleRosterUpdate}
        onSelectRoster={setSelectedRoster}
        assignments={assignments}
        onAssignmentsChange={setAssignments}
        onLayoutSaved={() => setLayoutRefreshKey((prev) => prev + 1)}
        onAnimatingChange={setIsAnimating}
      />
    </div>
  );
}
