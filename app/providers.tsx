"use client";

import { AuthProvider } from "@/lib/auth";
import SignupClosedDialog from "@/components/retirement/SignupClosedDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SignupClosedDialog />
    </AuthProvider>
  );
}







