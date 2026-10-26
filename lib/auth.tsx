"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/navigation";
import { isNewAccountAfterBlock } from "./retirement";

// Firebase가 설정되지 않은 경우를 위한 체크
if (typeof window !== "undefined" && !auth) {
  console.warn(
    "Firebase가 설정되지 않았습니다. .env.local 파일에 Firebase 설정을 추가해주세요."
  );
}

/** closed: 새 가입이 막혀 계정을 되돌림, check-failed: 가입 여부를 확인하지 못해 로그아웃함 */
export type SignupNotice = "closed" | "check-failed" | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signupNotice: SignupNotice;
  showSignupNotice: (notice: Exclude<SignupNotice, null>) => void;
  clearSignupNotice: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithNaver: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signupNotice, setSignupNotice] = useState<SignupNotice>(null);
  const router = useRouter();

  useEffect(() => {
    const authInstance = auth;
    if (!authInstance) {
      setLoading(false);
      return;
    }

    // 가입 차단일 이후에 만들어진 계정인데 저장된 데이터가 없으면 "새 가입"으로 보고 되돌려요.
    // 기존 사용자(차단일 전에 만든 계정)는 이 확인을 거치지 않아요.
    const screenNewAccount = async (
      candidate: User
    ): Promise<"allowed" | "closed" | "check-failed"> => {
      let hasData: boolean;
      try {
        const { hasAnyUserData } = await import("./firestore");
        hasData = await hasAnyUserData(candidate.uid);
      } catch (error) {
        console.error("가입 여부 확인 실패:", error);
        setSignupNotice("check-failed");
        await signOut(authInstance).catch(() => undefined);
        return "check-failed";
      }
      if (hasData) return "allowed";
      setSignupNotice("closed");
      try {
        await deleteUser(candidate);
      } catch (error) {
        // 로그인한 지 오래되어 삭제가 거절되면 로그아웃만 해요. 다음 로그인 때 다시 확인해요.
        console.warn("새 계정을 되돌리지 못해 로그아웃합니다:", error);
        await signOut(authInstance).catch(() => undefined);
      }
      return "closed";
    };

    let latest = 0;
    const unsubscribe = onAuthStateChanged(authInstance, async (nextUser) => {
      const run = ++latest;
      if (!nextUser || !isNewAccountAfterBlock(nextUser.metadata.creationTime)) {
        setUser(nextUser);
        setLoading(false);
        return;
      }
      setUser(null);
      setLoading(true);
      const outcome = await screenNewAccount(nextUser);
      // 확인하는 동안 로그아웃 등 더 새로운 상태 변화가 있었다면 그쪽을 따라요.
      if (run !== latest) return;
      setUser(outcome === "allowed" ? nextUser : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      alert("Firebase가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // 새 가입 확인이 필요한 계정은 첫 화면에 머물러요(확인되면 첫 화면이 대시보드로 보내요).
      if (!isNewAccountAfterBlock(result.user.metadata.creationTime)) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다. Firebase 설정을 확인해주세요.");
    }
  };

  const signInWithNaver = async () => {
    if (!auth) {
      alert("Firebase가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
      return;
    }

    try {
      const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
      if (!clientId) {
        alert(
          "네이버 로그인 설정이 필요합니다. NEXT_PUBLIC_NAVER_CLIENT_ID를 확인해주세요."
        );
        return;
      }

      const redirectUri = `${window.location.origin}/auth/naver/callback`;
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("naver_oauth_state", state);

      const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${state}&prompt=login`;

      window.location.href = naverAuthUrl;
    } catch (error) {
      console.error("네이버 로그인 실패:", error);
      alert("네이버 로그인에 실패했습니다.");
    }
  };

  const signInWithKakao = async () => {
    if (!auth) {
      alert("Firebase가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
      return;
    }

    try {
      const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
      if (!clientId) {
        alert(
          "카카오 로그인 설정이 필요합니다. NEXT_PUBLIC_KAKAO_CLIENT_ID를 확인해주세요."
        );
        return;
      }

      const redirectUri = `${window.location.origin}/auth/kakao/callback`;

      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&prompt=login&scope=profile_nickname,account_email,profile_image`;

      console.log("카카오 로그인 Redirect URI:", redirectUri);
      console.log("카카오 로그인 URL:", kakaoAuthUrl);

      window.location.href = kakaoAuthUrl;
    } catch (error) {
      console.error("카카오 로그인 실패:", error);
      alert("카카오 로그인에 실패했습니다.");
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const deleteAccount = async () => {
    if (!auth || !auth.currentUser) return;
    try {
      // Firestore 데이터 삭제
      const firestoreModule = await import("./firestore");
      await firestoreModule.deleteUserData(auth.currentUser.uid);

      // Firebase Auth 계정 삭제
      await deleteUser(auth.currentUser);

      router.push("/");
    } catch (error) {
      console.error("계정 삭제 실패:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signupNotice,
        showSignupNotice: setSignupNotice,
        clearSignupNotice: () => setSignupNotice(null),
        signInWithGoogle,
        signInWithNaver,
        signInWithKakao,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
