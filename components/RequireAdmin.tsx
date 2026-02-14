"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { isAdmin } from "@/lib/firestore";

interface RequireAdminProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RequireAdmin({
  children,
  redirectTo = "/board",
}: RequireAdminProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (loading) {
        return;
      }

      if (!user) {
        setAllowed(false);
        setChecking(false);
        router.replace("/");
        return;
      }

      try {
        const admin = await isAdmin(user.uid, user.email ?? undefined);
        setAllowed(admin);
        if (!admin) {
          router.replace(redirectTo);
        }
      } catch (error) {
        console.error("Admin permission check failed:", error);
        setAllowed(false);
        router.replace(redirectTo);
      } finally {
        setChecking(false);
      }
    };

    checkPermission();
  }, [loading, redirectTo, router, user]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
