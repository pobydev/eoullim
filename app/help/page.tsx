"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Grid3X3,
  Play,
  Save,
  Printer,
  Lock,
  Unlock,
  ArrowLeftRight,
  MapPin,
  Plus,
  Trash2,
  Settings,
  LogOut,
  Maximize2,
  RotateCcw,
  MousePointer,
  CheckCircle2,
  Circle,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Bell,
  Waves,
  Sparkles,
  Home,
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="어울림"
                className="h-16 w-auto object-contain"
              />
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                대시보드로
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 소개 */}
        <section className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            어울림에 오신 것을 환영합니다!
          </h2>
          <p className="text-gray-600">
            "자리에서 시작되는 우리 반의 새로운 이야기"
          </p>
          <p className="text-gray-500 text-sm">
            교실 자리 배치를 쉽고 빠르게 할 수 있는 도구입니다.
          </p>
        </section>

        {/* 탭 영역 */}
        <Tabs defaultValue="quickstart" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quickstart" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              빠른 시작
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              기능 안내
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* 빠른 시작 탭 */}
          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-sky-500" />
                  빠른 시작 가이드
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <StepItem
                    number={1}
                    title="학급 만들기"
                    description="좌측 사이드바에서 '학급 관리' 탭 → '새 학급 추가' 버튼을 클릭합니다."
                  />
                  <StepItem
                    number={2}
                    title="학생 입력하기"
                    description="학급 이름을 입력하고, 학생 목록을 입력합니다. 엑셀에서 복사해서 붙여넣기도 가능합니다."
                  />
                  <StepItem
                    number={3}
                    title="자리 배치 설정"
                    description="우측 패널에서 행/열 수, 배치 형태(기본형/분단형/모둠형(4인))를 설정합니다."
                  />
                  <StepItem
                    number={4}
                    title="배치 시작"
                    description="상단의 '배치 시작' 버튼을 클릭하면 자동으로 자리가 배치됩니다."
                  />
                  <StepItem
                    number={5}
                    title="저장 및 인쇄"
                    description="원하는 자리표가 완성되면 저장하거나 인쇄할 수 있습니다."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 기능 안내 탭 */}
          <TabsContent value="features" className="space-y-6">
            {/* 학급 관리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-500" />
                  학급 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FeatureItem
                  icon={<Plus className="h-4 w-4" />}
                  title="새 학급 추가"
                  description="학급 이름과 학생 목록을 입력하여 새로운 학급을 만듭니다. 학생 정보는 '번호, 이름, 성별' 형식으로 입력하거나 엑셀에서 복사해서 붙여넣을 수 있습니다."
                />
                <FeatureItem
                  icon={<MousePointer className="h-4 w-4" />}
                  title="학급 선택"
                  description="생성된 학급 카드를 클릭하면 해당 학급이 선택되어 자리 배치에 사용할 수 있습니다."
                />
                <FeatureItem
                  icon={<Trash2 className="h-4 w-4" />}
                  title="학급 삭제"
                  description="학급 카드의 휴지통 아이콘을 클릭하여 학급을 삭제할 수 있습니다."
                />
                <div className="bg-sky-50 p-4 rounded-lg">
                  <p className="text-sm text-sky-800">
                    <strong>💡 팁:</strong> 학생의 성별을 입력하면 자리 배치 시
                    남녀 짝꿍 옵션을 사용할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 자리 배치 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5 text-sky-500" />
                  자리 배치 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FeatureItem
                  icon={<Settings className="h-4 w-4" />}
                  title="배치 형태"
                  description="'기본형'은 일반적인 격자 배치, '분단형'은 2열씩 분단으로 나누어 배치, '모둠형(4인)'은 6×6 그리드로 자동 설정되어 모둠 배치에 적합합니다."
                />
                <FeatureItem
                  icon={<Grid3X3 className="h-4 w-4" />}
                  title="행/열 조절"
                  description="기본형은 최대 7×7까지, 분단형은 최대 8행까지 행과 열 수를 조절할 수 있습니다. 모둠형(4인)은 자동으로 6×6으로 설정되며 입력 필드가 표시되지 않습니다."
                />
                <FeatureItem
                  icon={<MousePointer className="h-4 w-4" />}
                  title="좌석 활성화/비활성화"
                  description="좌석을 클릭하면 활성(학생 배치 가능)과 비활성(통로/빈 공간) 상태가 전환됩니다. 비활성화된 좌석은 점선 테두리로 표시되며 학생이 배치되지 않습니다."
                />
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>📌 자주 쓰는 배치:</strong> '5×6', '6×5', '3분단',
                    '모둠(4인기준)' 프리셋을 사용하면 빠르게 설정할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 지정구역 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-sky-500" />
                  지정구역 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  특정 학생을 특정 구역에 배치하고 싶을 때 사용합니다. 예:
                  앞자리에 시력이 약한 학생 배치
                </p>
                <FeatureItem
                  icon={<Plus className="h-4 w-4" />}
                  title="지정구역 만들기"
                  description="'지정구역 관리' 카드의 + 버튼을 클릭하여 새 구역을 만듭니다. 최대 5개까지 만들 수 있습니다."
                />
                <FeatureItem
                  icon={<MapPin className="h-4 w-4" />}
                  title="좌석에 구역 할당"
                  description="구역의 '좌석 할당' 버튼을 클릭한 후, 해당 구역에 포함할 좌석들을 클릭합니다."
                />
                <FeatureItem
                  icon={<Users className="h-4 w-4" />}
                  title="학생 배정"
                  description="'배정' 버튼을 클릭하여 각 지정구역에 배치할 학생을 선택합니다."
                />
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✨ 참고:</strong> 지정구역에 학생을 배정하지 않으면,
                    해당 구역의 좌석은 일반 좌석처럼 사용됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 수동 조작 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-sky-500" />
                  수동 조작
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FeatureItem
                  icon={<ArrowLeftRight className="h-4 w-4" />}
                  title="자리 바꾸기 (Swap)"
                  description="배치된 학생 A를 클릭한 후, 학생 B를 클릭하면 두 학생의 자리가 교환됩니다."
                />
                <FeatureItem
                  icon={<Lock className="h-4 w-4" />}
                  title="자리 고정 (Lock)"
                  description="학생 카드의 자물쇠 아이콘을 클릭하면 해당 학생의 자리가 고정됩니다. 고정된 학생은 '배치 시작'을 해도 자리가 바뀌지 않습니다."
                />
                <FeatureItem
                  icon={<Unlock className="h-4 w-4" />}
                  title="고정 해제"
                  description="고정된 학생의 자물쇠 아이콘을 다시 클릭하면 고정이 해제됩니다."
                />
              </CardContent>
            </Card>

            {/* 성별 배치 옵션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-500" />
                  성별 배치 옵션
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  분단형 배치에서만 사용할 수 있는 옵션입니다.
                </p>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-20 font-medium text-sm">랜덤</div>
                    <div className="text-gray-600 text-sm">
                      성별 상관없이 랜덤하게 배치합니다.
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-20 font-medium text-sm">남녀 짝</div>
                    <div className="text-gray-600 text-sm">
                      같은 분단 내에서 남학생과 여학생이 짝이 되도록 배치합니다.
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-20 font-medium text-sm">동성 짝</div>
                    <div className="text-gray-600 text-sm">
                      같은 분단 내에서 같은 성별끼리 짝이 되도록 배치합니다.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 배치 효과 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-500" />
                  배치 효과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  자리 배치 결과를 공개하는 방식을 선택할 수 있습니다. 우측
                  패널의 '배치 효과' 섹션에서 선택합니다.
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 mb-1">
                        카운트다운
                      </div>
                      <div className="text-gray-600 text-sm">
                        3초 카운트다운 후 배치 결과가 공개됩니다. 종 아이콘이
                        회전하며 효과음이 재생됩니다.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Play className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 mb-1">
                        순차 배치
                      </div>
                      <div className="text-gray-600 text-sm">
                        학생들이 하나씩 랜덤한 순서로 배치됩니다. 학생 수에 따라
                        자동으로 속도가 조절됩니다.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                      <Waves className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 mb-1">
                        파도 배치
                      </div>
                      <div className="text-gray-600 text-sm">
                        앞줄부터 뒤줄까지 행 단위로 순차적으로 배치됩니다.
                        파도처럼 앞에서 뒤로 배치되는 효과를 볼 수 있습니다.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-sky-50 p-4 rounded-lg">
                  <p className="text-sm text-sky-800">
                    <strong>💡 팁:</strong> 배치 효과는 하나만 선택할 수 있으며,
                    선택하지 않으면 즉시 배치됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 저장 및 출력 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-sky-500" />
                  저장 및 출력
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FeatureItem
                  icon={<Save className="h-4 w-4" />}
                  title="자리표 저장"
                  description="상단의 '저장' 버튼을 클릭하여 현재 자리표를 저장합니다. 저장된 자리표는 좌측 사이드바의 '저장 목록' 탭에서 불러올 수 있습니다."
                />
                <FeatureItem
                  icon={<Maximize2 className="h-4 w-4" />}
                  title="전체화면 보기"
                  description="'자리확대' 버튼을 클릭하면 현재 배치를 전체화면으로 볼 수 있습니다. ESC 키 또는 X 버튼으로 종료합니다."
                />
                <FeatureItem
                  icon={<Printer className="h-4 w-4" />}
                  title="인쇄하기"
                  description="'인쇄' 버튼을 클릭하면 인쇄 미리보기가 열립니다. '교사용 보기'와 '학생용 보기' 중 선택하여 인쇄할 수 있습니다."
                />
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>🖨️ 인쇄 팁:</strong> '학생용 보기'는 칠판을 바라보는
                    방향으로 180도 회전되어 출력됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 기타 기능 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-sky-500" />
                  기타 기능
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FeatureItem
                  icon={<RotateCcw className="h-4 w-4" />}
                  title="배치 초기화"
                  description="'초기화' 버튼을 클릭하면 모든 학생의 배치가 해제됩니다. 고정된 학생도 해제됩니다."
                />
                <FeatureItem
                  icon={<Settings className="h-4 w-4" />}
                  title="프로필 설정"
                  description="좌측 사이드바의 설정(톱니바퀴) 아이콘을 클릭하여 표시 이름, 학교명, 담당 과목 등을 설정할 수 있습니다."
                />
                <FeatureItem
                  icon={<LogOut className="h-4 w-4" />}
                  title="로그아웃"
                  description="좌측 사이드바의 로그아웃 아이콘을 클릭하여 로그아웃합니다."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ 탭 */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-sky-500" />
                  자주 묻는 질문
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FAQItem
                  question="엑셀에서 학생 목록을 복사해서 붙여넣을 수 있나요?"
                  answer="네, 가능합니다. 엑셀에서 '번호, 이름, 성별(M/F)' 형식의 데이터를 복사하여 학생 목록 입력창에 붙여넣으면 자동으로 인식됩니다."
                />
                <FAQItem
                  question="배치가 마음에 들지 않으면 어떻게 하나요?"
                  answer="'배치 시작' 버튼을 다시 클릭하면 새로운 랜덤 배치가 생성됩니다. 고정(Lock)된 학생은 자리가 유지됩니다."
                />
                <FAQItem
                  question="이전에 저장한 자리표를 불러오려면?"
                  answer="좌측 사이드바의 '저장 목록' 탭에서 원하는 자리표 카드를 클릭하면 불러올 수 있습니다."
                />
                <FAQItem
                  question="특정 학생을 특정 자리에 고정하려면?"
                  answer="먼저 자동 배치를 실행한 후, 해당 학생을 원하는 자리로 수동으로 이동(Swap)시킨 다음 자물쇠 아이콘을 클릭하여 고정하세요."
                />
                <FAQItem
                  question="배치 효과는 무엇인가요?"
                  answer="배치 결과를 공개하는 방식을 선택할 수 있는 기능입니다. '카운트다운'은 3초 카운트다운 후 공개, '순차 배치'는 하나씩 랜덤 순서로 배치, '파도 배치'는 앞줄부터 뒤줄까지 행 단위로 배치됩니다. 하나만 선택할 수 있으며, 선택하지 않으면 즉시 배치됩니다."
                />
                <FAQItem
                  question="행/열 수를 얼마까지 설정할 수 있나요?"
                  answer="기본형은 최대 7×7까지, 분단형은 최대 8행까지 설정할 수 있습니다. 모둠형(4인)은 자동으로 6×6으로 설정되며 수동 조절이 불가능합니다."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 하단 */}
        <div className="text-center py-8 mt-8">
          <Link href="/dashboard">
            <Button size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

// 단계 아이템 컴포넌트
function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}

// 기능 아이템 컴포넌트
function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-gray-800">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}

// FAQ 아이템 컴포넌트
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <h4 className="font-medium text-gray-800 mb-1">Q. {question}</h4>
      <p className="text-gray-600 text-sm">A. {answer}</p>
    </div>
  );
}
