import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  }

  // 파일 타입 검증
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  // 파일 크기 제한 (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("파일 크기는 5MB를 초과할 수 없습니다.");
  }

  // 파일 경로 생성: board/images/{userId}/{timestamp}-{filename}
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const storageRef = ref(storage, `board/images/${userId}/${filename}`);

  // 파일 업로드
  await uploadBytes(storageRef, file);

  // 다운로드 URL 가져오기
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function deleteImage(imageUrl: string): Promise<void> {
  if (!storage) {
    throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  }

  try {
    // URL에서 경로 추출
    const urlObj = new URL(imageUrl);
    const path = decodeURIComponent(urlObj.pathname.split("/o/")[1].split("?")[0]);
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("이미지 삭제 실패:", error);
    // 삭제 실패해도 에러를 던지지 않음 (이미 삭제되었을 수 있음)
  }
}

export function getImageUrl(imagePath: string): string {
  if (!storage) {
    throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  }
  const storageRef = ref(storage, imagePath);
  // 실제로는 getDownloadURL을 사용해야 하지만, 경로만 반환하는 헬퍼 함수
  return imagePath;
}

