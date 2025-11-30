"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCustomToken,
  signOut,
  deleteUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/navigation";

// Firebase가 설정되지 않은 경우를 위한 체크
if (typeof window !== "undefined" && !auth) {
  console.warn(
    "Firebase가 설정되지 않았습니다. .env.local 파일에 Firebase 설정을 추가해주세요."
  );
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
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
