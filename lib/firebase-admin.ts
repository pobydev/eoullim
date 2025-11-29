import * as admin from "firebase-admin";

// Firebase Admin 초기화 (한 번만)
if (!admin.apps.length) {
  try {
    // 환경 변수에서 Firebase Admin 설정 가져오기
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      console.warn("Firebase Admin 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.");
    }
  } catch (error) {
    console.error("Firebase Admin 초기화 실패:", error);
  }
}

export default admin;

