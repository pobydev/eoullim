export type Gender = "M" | "F" | undefined;

// 지정구역 정보
export interface Zone {
  id: string;
  name: string; // 예: "앞자리", "뒷자리", "시력보호" 등
  color: string; // 테두리 색상 (예: "yellow", "blue", "green")
}

// 지정구역별 학생 매핑
export interface ZoneStudentMapping {
  zoneId: string;
  studentIds: string[];
}

export interface Student {
  id: string;
  name: string;
  gender?: Gender; // 성별 (선택사항)
  attendanceNumber?: number; // 출석번호
}

export interface ClassRoster {
  id: string;
  className: string;
  students: Student[];
  createdAt?: Date;
}

export interface Cell {
  r: number;
  c: number;
  isActive: boolean;
  zoneId: string | null; // isPriorityZone 대신 zoneId 사용
}

export interface SeatAssignment {
  seat: { r: number; c: number };
  studentId: string | null;
  isLocked: boolean;
}

export interface LayoutConfig {
  rows: number;
  cols: number;
  layoutType?: "기본형" | "분단형" | "모둠형(4인)"; // 레이아웃 타입
  genderOption?: "남녀 짝" | "동성 짝" | "랜덤";
  zones: Zone[]; // 지정구역 목록
}

export interface Layout {
  id: string;
  title: string;
  classId: string;
  config: LayoutConfig;
  cells: Cell[];
  currentAssignment: SeatAssignment[];
  zoneStudentMapping?: ZoneStudentMapping[]; // 배치 시 사용된 매핑 (선택적)
  createdAt?: Date;
}

export type GenderOption = "남녀 짝" | "동성 짝" | "랜덤";

// 사용자 프로필
export interface UserProfile {
  displayName?: string; // 앱 내 표시 이름
  schoolName?: string; // 학교 이름
  subject?: string; // 과목
  createdAt?: Date;
  updatedAt?: Date;
}

// 미리 정의된 색상 배열 (5개까지만 지정구역 추가 가능)
export const ZONE_COLORS = [
  "lime",
  "yellow",
  "rose",
  "violet",
  "orange",
] as const;
export type ZoneColor = (typeof ZONE_COLORS)[number];

// 게시판 관련 타입
export type FeedbackCategory = "질문" | "기능제안" | "불편사항" | "기타";
export type FeedbackStatus = "답변 대기" | "답변 중" | "답변 완료";
export type PostType = "notice" | "feedback";

// 공지사항
export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  isPinned: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  viewCount: number;
}

// 피드백/질문
export interface Feedback {
  id: string;
  title: string;
  content: string;
  category: FeedbackCategory;
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: FeedbackStatus;
  adminReply?: string;
  repliedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  viewCount: number;
}

// 댓글
export interface Comment {
  id: string;
  postId: string;
  postType: PostType;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isAdmin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
