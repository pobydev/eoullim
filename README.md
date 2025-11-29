# 어울림 (Eoullim)

교사 전용 스마트 자리 배치 플랫폼

## 프로젝트 개요

"자리에서 시작되는 우리 반의 새로운 이야기"를 슬로건으로 하는 교실 자리 배치 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: Next.js 14+ (App Router), TypeScript
- **Styling**: Tailwind CSS
- **UI Component**: shadcn/ui
- **Backend/DB**: Firebase (Auth, Firestore)

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Firebase 설정

1. Firebase 콘솔에서 새 프로젝트를 생성합니다.
2. Authentication에서 Google 로그인을 활성화합니다.
3. Firestore Database를 생성합니다.
4. Firebase Storage를 활성화합니다.
5. `.env.local` 파일을 생성하고 Firebase 설정 값을 입력합니다:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

6. **Firestore 보안 규칙 설정**:
   - Firebase Console > Firestore Database > Rules로 이동
   - 프로젝트 루트의 `firestore.rules` 파일 내용을 복사하여 붙여넣기
   - **중요**: `isAdmin()` 함수 내의 admin 이메일 목록을 실제 관리자 이메일로 변경해야 합니다
   - 규칙을 게시합니다

7. **Firebase Storage 보안 규칙 설정**:
   - Firebase Console > Storage > Rules로 이동
   - 다음 규칙을 추가합니다:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /board/images/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
         allow delete: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 주요 기능

- ✅ Google 로그인 인증
- ✅ 반별 명단 관리 (추가/불러오기/저장)
- ✅ 커스텀 그리드 설정 (최대 8x8)
- ✅ 좌석 활성화/비활성화
- ✅ 다중 지정구역 설정 및 관리
- ✅ 학생 속성 관리 (성별)
- ✅ 자동 배치 알고리즘
- ✅ 수동 조작 (Swap, Lock)
- ✅ 배치 저장 및 불러오기
- ✅ 게시판 시스템 (공지사항, 피드백, 댓글)
- ✅ 마크다운 에디터 및 이미지 업로드

## 프로젝트 구조

```
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 랜딩 페이지
│   ├── dashboard/         # 대시보드 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # React 컴포넌트
│   ├── dashboard/         # 대시보드 관련 컴포넌트
│   └── ui/               # shadcn/ui 컴포넌트
├── lib/                   # 유틸리티 및 라이브러리
│   ├── auth.tsx          # 인증 로직
│   ├── firebase.ts       # Firebase 설정
│   ├── firestore.ts      # Firestore 함수
│   └── layout-algorithm.ts # 배치 알고리즘
└── types/                 # TypeScript 타입 정의
```

## 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.
