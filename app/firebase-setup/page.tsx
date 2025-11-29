"use client";

export default function FirebaseSetupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-2xl p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          Firebase 설정이 필요합니다
        </h1>
        <div className="space-y-4">
          <p className="text-gray-700">
            어울림을 사용하려면 Firebase 설정이 필요합니다. 다음 단계를 따라주세요:
          </p>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">1. Firebase 프로젝트 생성</h2>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
              <li>
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Firebase 콘솔
                </a>
                에 접속합니다
              </li>
              <li>새 프로젝트를 생성합니다</li>
              <li>프로젝트 이름을 입력하고 생성합니다</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">2. Authentication 설정</h2>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
              <li>좌측 메뉴에서 "Authentication"을 클릭합니다</li>
              <li>"시작하기" 버튼을 클릭합니다</li>
              <li>"Sign-in method" 탭에서 "Google"을 활성화합니다</li>
              <li>프로젝트 지원 이메일을 선택하고 저장합니다</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">3. Firestore Database 설정</h2>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
              <li>좌측 메뉴에서 "Firestore Database"를 클릭합니다</li>
              <li>"데이터베이스 만들기"를 클릭합니다</li>
              <li>"테스트 모드로 시작"을 선택합니다 (나중에 보안 규칙 설정 필요)</li>
              <li>위치를 선택하고 활성화합니다</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">4. 웹 앱 추가 및 설정</h2>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
              <li>프로젝트 설정(톱니바퀴 아이콘)을 클릭합니다</li>
              <li>"내 앱" 섹션에서 웹 아이콘(&lt;/&gt;)을 클릭합니다</li>
              <li>앱 닉네임을 입력하고 "앱 등록"을 클릭합니다</li>
              <li>Firebase SDK 설정에서 "구성"을 선택합니다</li>
              <li>표시된 설정 값을 복사합니다</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">5. .env.local 파일 생성</h2>
            <p className="text-gray-700">
              프로젝트 루트 디렉토리에 <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> 파일을 생성하고 다음 내용을 추가하세요:
            </p>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              <code>{`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">6. 개발 서버 재시작</h2>
            <p className="text-gray-700">
              .env.local 파일을 저장한 후, 개발 서버를 재시작하세요:
            </p>
            <pre className="bg-gray-100 p-4 rounded">
              <code>pnpm dev</code>
            </pre>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>참고:</strong> .env.local 파일은 Git에 커밋하지 마세요. 이미
              .gitignore에 포함되어 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}







