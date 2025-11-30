import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  increment,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { ClassRoster, Layout, UserProfile, Notice, Feedback, Comment, FeedbackCategory, FeedbackStatus, PostType } from "@/types";

if (typeof window !== "undefined" && !db) {
  console.warn(
    "Firestore가 초기화되지 않았습니다. Firebase 설정을 확인해주세요."
  );
}

export async function saveClassRoster(userId: string, roster: ClassRoster) {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const rosterRef = doc(db, `users/${userId}/classRosters`, roster.id);
  await setDoc(rosterRef, {
    ...roster,
    createdAt: Timestamp.now(),
  });
}

export async function getClassRosters(userId: string): Promise<ClassRoster[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, `users/${userId}/classRosters`));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, any>;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as ClassRoster;
  });
}

export async function getClassRoster(
  userId: string,
  classId: string
): Promise<ClassRoster | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const rosterRef = doc(db, `users/${userId}/classRosters`, classId);
  const snapshot = await getDoc(rosterRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
  } as ClassRoster;
}

export async function deleteClassRoster(userId: string, classId: string) {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const rosterRef = doc(db, `users/${userId}/classRosters`, classId);
  await deleteDoc(rosterRef);
}

export async function saveLayout(userId: string, layout: Layout) {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const layoutRef = doc(db, `users/${userId}/layouts`, layout.id);
  
  // undefined 값을 가진 필드를 제거하여 Firestore 저장 오류 방지
  const layoutData: any = {
    ...layout,
    createdAt: Timestamp.now(),
  };
  
  // undefined 값을 가진 필드 제거
  Object.keys(layoutData).forEach((key) => {
    if (layoutData[key] === undefined) {
      delete layoutData[key];
    }
  });
  
  await setDoc(layoutRef, layoutData);
}

export async function getLayouts(userId: string): Promise<Layout[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, `users/${userId}/layouts`));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, any>;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Layout;
  });
}

export async function getLayout(
  userId: string,
  layoutId: string
): Promise<Layout | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const layoutRef = doc(db, `users/${userId}/layouts`, layoutId);
  const snapshot = await getDoc(layoutRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
  } as Layout;
}

export async function deleteLayout(userId: string, layoutId: string) {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const layoutRef = doc(db, `users/${userId}/layouts`, layoutId);
  await deleteDoc(layoutRef);
}

// 사용자 프로필 관련 함수
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const userRef = doc(db, `users`, userId);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  // 프로필 필드가 하나라도 있으면 프로필이 있는 것으로 간주
  if (data.displayName !== undefined || data.schoolName !== undefined || data.subject !== undefined) {
    return {
      displayName: data.displayName?.trim() || undefined,
      schoolName: data.schoolName?.trim() || undefined,
      subject: data.subject?.trim() || undefined,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as UserProfile;
  }
  return null;
}

export async function saveUserProfile(userId: string, profile: UserProfile) {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const userRef = doc(db, `users`, userId);
  const updateData: any = {
    updatedAt: Timestamp.now(),
  };
  
  // displayName이 있으면 저장, 없으면 null로 설정하여 필드 삭제
  if (profile.displayName && profile.displayName.trim()) {
    updateData.displayName = profile.displayName.trim();
  } else {
    updateData.displayName = null;
  }
  
  // schoolName이 있으면 저장, 없으면 null로 설정하여 필드 삭제
  if (profile.schoolName && profile.schoolName.trim()) {
    updateData.schoolName = profile.schoolName.trim();
  } else {
    updateData.schoolName = null;
  }
  
  // subject가 있으면 저장, 없으면 null로 설정하여 필드 삭제
  if (profile.subject && profile.subject.trim()) {
    updateData.subject = profile.subject.trim();
  } else {
    updateData.subject = null;
  }
  
  // createdAt이 없으면 현재 시간으로 설정
  if (profile.createdAt) {
    updateData.createdAt = Timestamp.fromDate(profile.createdAt);
  } else {
    updateData.createdAt = Timestamp.now();
  }
  
  await setDoc(userRef, updateData, { merge: true });
}

// 사용자 계정 삭제 (모든 데이터 삭제)
export async function deleteUserData(userId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const batch = writeBatch(db);
  
  // 사용자의 모든 명단 삭제
  const rostersRef = collection(db, `users/${userId}/classRosters`);
  const rostersSnapshot = await getDocs(rostersRef);
  rostersSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // 사용자의 모든 레이아웃 삭제
  const layoutsRef = collection(db, `users/${userId}/layouts`);
  const layoutsSnapshot = await getDocs(layoutsRef);
  layoutsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // 사용자 프로필 문서 삭제
  const userRef = doc(db, `users`, userId);
  batch.delete(userRef);
  
  await batch.commit();
}

// ==================== 공지사항 관련 함수 ====================

export async function createNotice(notice: Omit<Notice, "id" | "createdAt" | "updatedAt" | "viewCount">): Promise<string> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const noticeRef = doc(collection(db, "notices"));
  const now = Timestamp.now();
  await setDoc(noticeRef, {
    ...notice,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
  });
  return noticeRef.id;
}

export async function getNotices(): Promise<Notice[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const notices = snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, any>;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Notice;
  });
  
  // 고정글을 상단으로 정렬 (클라이언트 사이드)
  return notices.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

export async function getNotice(noticeId: string): Promise<Notice | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const noticeRef = doc(db, "notices", noticeId);
  const snapshot = await getDoc(noticeRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
  } as Notice;
}

export async function updateNotice(noticeId: string, updates: Partial<Notice>): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const noticeRef = doc(db, "notices", noticeId);
  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  // undefined 값 제거
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  await updateDoc(noticeRef, updateData);
}

export async function deleteNotice(noticeId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const noticeRef = doc(db, "notices", noticeId);
  await deleteDoc(noticeRef);
}

export async function incrementNoticeViewCount(noticeId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const noticeRef = doc(db, "notices", noticeId);
  await updateDoc(noticeRef, {
    viewCount: increment(1),
  });
}

// ==================== 피드백 관련 함수 ====================

export async function createFeedback(feedback: Omit<Feedback, "id" | "createdAt" | "updatedAt" | "viewCount" | "status">): Promise<string> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const feedbackRef = doc(collection(db, "feedbacks"));
  const now = Timestamp.now();
  await setDoc(feedbackRef, {
    ...feedback,
    status: "답변 대기" as FeedbackStatus,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
  });
  return feedbackRef.id;
}

export interface GetFeedbacksOptions {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  searchQuery?: string;
}

export async function getFeedbacks(options?: GetFeedbacksOptions): Promise<Feedback[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  let q: any = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
  
  if (options?.category) {
    q = query(q, where("category", "==", options.category));
  }
  
  if (options?.status) {
    q = query(q, where("status", "==", options.status));
  }
  
  const snapshot = await getDocs(q);
  let feedbacks = snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, any>;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      repliedAt: data.repliedAt?.toDate(),
    } as Feedback;
  });
  
  // 클라이언트 사이드 검색 (Firestore 쿼리 제한으로 인해)
  if (options?.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    feedbacks = feedbacks.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.content.toLowerCase().includes(query)
    );
  }
  
  return feedbacks;
}

export async function getFeedback(feedbackId: string): Promise<Feedback | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const feedbackRef = doc(db, "feedbacks", feedbackId);
  const snapshot = await getDoc(feedbackRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
    repliedAt: snapshot.data().repliedAt?.toDate(),
  } as Feedback;
}

export async function updateFeedback(feedbackId: string, updates: Partial<Feedback>): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const feedbackRef = doc(db, "feedbacks", feedbackId);
  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  
  // repliedAt이 설정되면 타임스탬프 변환
  if (updates.repliedAt) {
    updateData.repliedAt = Timestamp.fromDate(updates.repliedAt);
  }
  
  // undefined 값 제거
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  await updateDoc(feedbackRef, updateData);
}

export async function deleteFeedback(feedbackId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const feedbackRef = doc(db, "feedbacks", feedbackId);
  await deleteDoc(feedbackRef);
}

export async function incrementFeedbackViewCount(feedbackId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const feedbackRef = doc(db, "feedbacks", feedbackId);
  await updateDoc(feedbackRef, {
    viewCount: increment(1),
  });
}

// ==================== 댓글 관련 함수 ====================

export async function createComment(
  comment: Omit<Comment, "id" | "createdAt" | "updatedAt">,
  isAdminUser?: boolean
): Promise<string> {
  if (!db) {
    throw new Error("Firestore가 초기화되지 않았습니다.");
  }
  
  try {
    const commentRef = doc(collection(db, "comments"));
    const now = Timestamp.now();
    await setDoc(commentRef, {
      ...comment,
      isAdmin: isAdminUser || false,
      createdAt: now,
      updatedAt: now,
    });
    
    // 관리자가 Q&A에 댓글을 달면 자동으로 상태를 "답변 완료"로 변경
    if (isAdminUser && comment.postType === "feedback") {
      try {
        await updateFeedback(comment.postId, {
          status: "답변 완료" as FeedbackStatus,
        });
      } catch (error) {
        console.error("Q&A 상태 업데이트 실패:", error);
        // 댓글은 성공했으므로 에러를 던지지 않음
      }
    }
    
    return commentRef.id;
  } catch (error: any) {
    console.error("댓글 생성 오류:", error);
    // 권한 오류인 경우 더 명확한 메시지 제공
    if (error?.code === "permission-denied") {
      throw new Error("댓글 작성 권한이 없습니다. 로그인 상태를 확인해주세요.");
    }
    throw error;
  }
}

export async function getComments(postId: string, postType: PostType): Promise<Comment[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  try {
    // 복합 쿼리를 사용할 때 인덱스가 필요할 수 있으므로, 먼저 단순 쿼리로 시도
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      where("postType", "==", postType),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Comment;
    });
    return comments;
  } catch (error: any) {
    // 인덱스 오류인 경우, orderBy 없이 조회 후 클라이언트에서 정렬
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      console.warn("인덱스가 없어 클라이언트에서 정렬합니다:", error);
      const q = query(
        collection(db, "comments"),
        where("postId", "==", postId),
        where("postType", "==", postType)
      );
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, any>;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Comment;
      });
      // 클라이언트에서 날짜순 정렬
      return comments.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
    }
    throw error;
  }
}

export async function updateComment(commentId: string, updates: Partial<Comment>): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const commentRef = doc(db, "comments", commentId);
  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  // undefined 값 제거
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  await updateDoc(commentRef, updateData);
}

export async function deleteComment(commentId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  // 삭제 전에 댓글 정보 가져오기
  const commentRef = doc(db, "comments", commentId);
  const commentSnap = await getDoc(commentRef);
  
  if (!commentSnap.exists()) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }
  
  const commentData = commentSnap.data() as Comment;
  const wasAdminComment = commentData.isAdmin;
  const postId = commentData.postId;
  const postType = commentData.postType;
  
  // 댓글 삭제
  await deleteDoc(commentRef);
  
  // 관리자 댓글이 삭제되었고, Q&A 게시글인 경우 상태 확인
  if (wasAdminComment && postType === "feedback") {
    try {
      // 남은 댓글 중 관리자 댓글이 있는지 확인
      const remainingComments = await getComments(postId, postType);
      const hasAdminComment = remainingComments.some(c => c.isAdmin);
      
      // 관리자 댓글이 없으면 상태를 "답변 대기"로 변경
      if (!hasAdminComment) {
        await updateFeedback(postId, {
          status: "답변 대기" as FeedbackStatus,
        });
      }
    } catch (error) {
      console.error("Q&A 상태 업데이트 실패:", error);
      // 댓글은 삭제되었으므로 에러를 던지지 않음
    }
  }
}

// ==================== 관리자 체크 함수 ====================

export async function isAdmin(userId: string, userEmail?: string): Promise<boolean> {
  // 초기 구현: 환경 변수에서 관리자 이메일 목록 확인
  // 나중에 Custom Claims로 확장 가능하도록 설계
  if (!userEmail) {
    console.log("[isAdmin] userEmail이 없습니다.");
    return false;
  }
  
  const adminEmailsString = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  console.log("[isAdmin] 환경 변수:", adminEmailsString);
  console.log("[isAdmin] 사용자 이메일:", userEmail);
  
  const adminEmails = adminEmailsString?.split(",").map((e) => e.trim().toLowerCase()) || [];
  const normalizedUserEmail = userEmail.toLowerCase().trim();
  
  console.log("[isAdmin] 관리자 이메일 목록:", adminEmails);
  console.log("[isAdmin] 정규화된 사용자 이메일:", normalizedUserEmail);
  console.log("[isAdmin] 관리자 여부:", adminEmails.includes(normalizedUserEmail));
  
  return adminEmails.includes(normalizedUserEmail);
}

