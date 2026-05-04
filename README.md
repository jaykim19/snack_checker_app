핵심 요약
간식 섭취 횟수를 기록하고, 누적 횟수에 따라 캐릭터가 변화하며, 일별 히스토리를 바 그래프로 확인하는 웹앱 명세서입니다.

1. 서비스 개요
서비스명
가칭: Snack Buddy
목적: 사용자가 하루 간식 섭취 횟수를 쉽고 재미있게 기록하도록 돕는 웹 앱
핵심 콘셉트
간식을 먹을 때마다 버튼을 눌러 횟수 기록
오늘의 간식 횟수에 따라 캐릭터 상태 변화
일별 기록을 저장하고 히스토리에서 바 그래프로 확인
단순 기록 앱이 아니라, 캐릭터 변화로 재미와 자기관리 동기를 제공
2. 주요 사용자 시나리오
기본 사용 흐름
사용자가 웹앱에 접속한다.
메인 화면에서 오늘의 간식 횟수를 확인한다.
간식을 먹으면 + 간식 먹음 버튼을 누른다.
횟수가 증가하면서 캐릭터 이미지가 단계별로 변화한다.
하루가 지나면 해당 날짜의 횟수가 히스토리에 저장된다.
히스토리 메뉴에서 일별 간식 횟수를 바 그래프로 확인한다.
예시 시나리오
2026년 5월 4일
오전: 과자 1회
오후: 초콜릿 1회
저녁: 아이스크림 1회
총 3회 기록
캐릭터가 3단계 상태로 변화
히스토리에는 2026-05-04 / 3회로 저장
3. 핵심 기능 정의
3.1 간식 횟수 체크 기능
기능 설명
사용자가 간식을 먹은 횟수를 기록하는 기능
버튼 클릭 시 오늘 날짜의 카운트가 1씩 증가
주요 UI 요소
오늘 날짜 표시
오늘의 간식 횟수 표시
+ 간식 먹음 버튼
- 1회 취소 버튼
오늘 기록 초기화 버튼
상세 동작
+ 간식 먹음 클릭 시:
오늘 날짜의 count 값 +1
캐릭터 상태 즉시 변경
로컬 저장소 또는 DB에 저장
- 1회 취소 클릭 시:
오늘 count 값 -1
단, count가 0보다 작아지지 않도록 제한
오늘 기록 초기화 클릭 시:
확인 팝업 노출
확인 시 오늘 count를 0으로 변경
예외 처리
하루 횟수가 0일 경우 취소 버튼 비활성화
중복 클릭 방지를 위해 버튼 클릭 후 짧은 로딩 또는 debounce 적용 가능
날짜가 바뀌면 자동으로 새로운 날짜의 기록 생성
3.2 캐릭터 변화 기능
기능 설명
오늘의 간식 횟수에 따라 캐릭터 이미지 또는 상태가 변화하는 기능
캐릭터 단계 예시
단계	조건	캐릭터 상태	메시지
0단계	0회	기본 상태	오늘은 아직 간식 전이에요
1단계	1회	살짝 행복한 상태	가볍게 하나 먹었어요
2단계	2회	볼이 통통한 상태	간식 기분이 올라왔어요
3단계	3회	배가 나온 상태	오늘은 꽤 먹었네요
4단계	4회	많이 통통한 상태	조금 조절해볼까요?
5단계	5회 이상	최고 단계	내일은 가볍게 시작해봐요
구현 방식
횟수별 이미지 파일을 준비하여 조건에 따라 교체
예시 파일명:
character_0.svg
character_1.svg
character_2.svg
character_3.svg
character_4.svg
character_5.svg
추천 캐릭터 방향
앱 접근성을 위해 심플한 SVG 캐릭터 사용
단계별 변화는 과하지 않게 표현
사용자가 죄책감을 느끼지 않도록 부드러운 메시지 사용
햄스터, 고양이, 강아지 등 친근한 캐릭터 추천
3.3 일별 기록 저장 기능
기능 설명
날짜별 간식 횟수를 저장하는 기능
사용자가 앱을 종료했다가 다시 접속해도 기록 유지
저장 데이터 예시
{
  "2026-05-01": 2,
  "2026-05-02": 4,
  "2026-05-03": 1,
  "2026-05-04": 3
}
저장 방식
1차 버전 추천
localStorage 사용
로그인 없이 빠르게 개발 가능
개인 기기 내 기록 저장
확장 버전
Firebase, Supabase, PostgreSQL 등 DB 연동
로그인 기능 추가
여러 기기에서 기록 동기화 가능
저장 시점
간식 횟수 증가 시
간식 횟수 감소 시
오늘 기록 초기화 시
날짜 변경 감지 시
3.4 히스토리 메뉴 기능
기능 설명
사용자가 일별 간식 섭취 기록을 확인하는 메뉴
바 그래프 형태로 시각화
주요 UI 요소
기간 선택:
최근 7일
최근 14일
최근 30일
일별 바 그래프
평균 간식 횟수
가장 많이 먹은 날
가장 적게 먹은 날
히스토리 예시
날짜	간식 횟수
5/1	2회
5/2	4회
5/3	1회
5/4	3회
그래프 구현 방식
Chart.js 또는 Recharts 사용
X축: 날짜
Y축: 간식 횟수
막대 높이: 해당 날짜의 간식 횟수
그래프 기능
날짜별 count 표시
그래프 hover 시 상세 횟수 표시
데이터가 없는 날짜는 0회로 표시
모바일에서도 가독성 유지
4. 화면 구성 명세
4.1 메인 화면
화면 목적
오늘의 간식 횟수를 빠르게 기록하고 캐릭터 변화를 확인하는 화면
구성 요소
앱 로고 또는 서비스명
오늘 날짜
캐릭터 이미지
현재 상태 메시지
오늘의 간식 횟수
+ 간식 먹음 버튼
- 1회 취소 버튼
히스토리 보기 버튼
화면 예시 구조
[Snack Buddy]

2026년 5월 4일

      [캐릭터 이미지]

오늘 간식 3회
"오늘은 꽤 먹었네요"

[+ 간식 먹음]
[- 1회 취소]

[히스토리 보기]
4.2 히스토리 화면
화면 목적
일별 간식 횟수를 그래프로 확인하는 화면
구성 요소
상단 뒤로가기 버튼
화면 제목: 히스토리
기간 필터
바 그래프
요약 정보 카드
요약 정보 카드
최근 7일 총 간식 횟수
일평균 간식 횟수
가장 많이 먹은 날
연속 기록 일수
화면 예시 구조
[← 뒤로가기] 히스토리

[최근 7일] [최근 14일] [최근 30일]

      [바 그래프]

최근 7일 총 18회
일평균 2.6회
가장 많이 먹은 날: 5월 2일 / 4회
4.3 설정 화면
1차 버전에서는 선택 기능
캐릭터 종류 선택
하루 목표 횟수 설정
데이터 초기화
다크모드 설정
추천 설정 항목
항목	설명
하루 목표 횟수	예: 하루 2회 이하
캐릭터 선택	고양이, 햄스터, 강아지
알림 문구 톤	귀여운 톤, 담백한 톤
전체 데이터 삭제	저장된 히스토리 초기화
5. 데이터 구조 명세
5.1 기본 데이터 모델
type SnackRecord = {
  date: string;
  count: number;
  updatedAt: string;
};
예시
{
  "date": "2026-05-04",
  "count": 3,
  "updatedAt": "2026-05-04T21:30:00+09:00"
}
5.2 localStorage 저장 구조
type SnackHistory = {
  [date: string]: number;
};
예시
{
  "2026-05-01": 2,
  "2026-05-02": 4,
  "2026-05-03": 1,
  "2026-05-04": 3
}
localStorage key
snack_history
5.3 설정 데이터 구조
type SnackSettings = {
  dailyGoal: number;
  characterType: "cat" | "hamster" | "dog";
  theme: "light" | "dark";
};
localStorage key
snack_settings
6. 캐릭터 상태 로직
6.1 단계 판단 로직
function getCharacterLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count === 4) return 4;
  return 5;
}
6.2 메시지 판단 로직
function getSnackMessage(count: number): string {
  if (count === 0) return "오늘은 아직 간식 전이에요.";
  if (count === 1) return "가볍게 하나 먹었어요.";
  if (count === 2) return "간식 타임이 즐거웠네요.";
  if (count === 3) return "오늘은 꽤 먹었네요.";
  if (count === 4) return "조금 천천히 가볼까요?";
  return "내일은 가볍게 시작해봐요.";
}
7. 기술 스택 제안
7.1 프론트엔드
추천 스택
Next.js
TypeScript
Tailwind CSS
Recharts
localStorage
선택 이유
Next.js는 웹앱 구조를 잡기 좋음
TypeScript는 데이터 구조 관리에 안정적
Tailwind CSS는 빠르게 깔끔한 UI 구현 가능
Recharts는 히스토리 바 그래프 구현에 적합
localStorage는 1차 MVP에서 백엔드 없이 기록 저장 가능
7.2 추후 확장 스택
기능	추천 기술
로그인	NextAuth, Supabase Auth, Firebase Auth
DB 저장	Supabase, Firebase, PostgreSQL
알림	Web Push, PWA Notification
앱 설치형 전환	PWA
이미지 관리	SVG 파일 또는 Lottie
배포	Vercel
8. 폴더 구조 예시
snack-buddy/
├─ app/
│  ├─ page.tsx
│  ├─ history/
│  │  └─ page.tsx
│  └─ settings/
│     └─ page.tsx
├─ components/
│  ├─ Character.tsx
│  ├─ SnackCounter.tsx
│  ├─ HistoryChart.tsx
│  ├─ SummaryCard.tsx
│  └─ Header.tsx
├─ lib/
│  ├─ storage.ts
│  ├─ date.ts
│  └─ character.ts
├─ public/
│  └─ characters/
│     ├─ character_0.svg
│     ├─ character_1.svg
│     ├─ character_2.svg
│     ├─ character_3.svg
│     ├─ character_4.svg
│     └─ character_5.svg
├─ types/
│  └─ snack.ts
└─ package.json
9. 주요 컴포넌트 명세
9.1 Character 컴포넌트
역할
현재 간식 횟수에 맞는 캐릭터 이미지를 표시
Props
type CharacterProps = {
  count: number;
  characterType?: "cat" | "hamster" | "dog";
};
기능
count에 따라 level 계산
level에 맞는 이미지 출력
상태 메시지 함께 표시
9.2 SnackCounter 컴포넌트
역할
간식 횟수 증가, 감소, 초기화 담당
Props
type SnackCounterProps = {
  count: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
};
기능
현재 count 표시
증가 버튼
감소 버튼
초기화 버튼
9.3 HistoryChart 컴포넌트
역할
저장된 일별 데이터를 바 그래프로 표시
Props
type HistoryChartProps = {
  data: {
    date: string;
    count: number;
  }[];
};
기능
X축 날짜 표시
Y축 횟수 표시
count 기준 막대 그래프 출력
데이터가 없는 날짜는 0회 처리
9.4 SummaryCard 컴포넌트
역할
히스토리 데이터를 요약해서 보여주는 카드
표시 항목
총 간식 횟수
일평균 횟수
최고 기록 날짜
목표 이하 달성 일수
10. 저장 및 조회 로직
10.1 오늘 날짜 가져오기
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
주의사항
한국 시간 기준으로 날짜가 저장되어야 함
단순 toISOString()은 UTC 기준이므로 실제 서비스에서는 KST 보정 필요
KST 기준 예시
function getKSTDateKey(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
10.2 기록 저장
function saveSnackHistory(history: SnackHistory) {
  localStorage.setItem("snack_history", JSON.stringify(history));
}
10.3 기록 불러오기
function loadSnackHistory(): SnackHistory {
  const saved = localStorage.getItem("snack_history");
  return saved ? JSON.parse(saved) : {};
}
10.4 오늘 횟수 증가
function increaseTodayCount() {
  const today = getKSTDateKey();
  const history = loadSnackHistory();

  history[today] = (history[today] || 0) + 1;

  saveSnackHistory(history);
}
11. 히스토리 그래프 데이터 가공
11.1 최근 7일 데이터 생성
function getRecentDaysData(days: number, history: SnackHistory) {
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    result.push({
      date: key.slice(5),
      count: history[key] || 0
    });
  }

  return result;
}
개선 필요 사항
위 코드도 UTC 기준 이슈가 있을 수 있음
실제 구현 시 KST 기준 날짜 유틸 함수로 통일하는 것이 좋음
12. UX/UI 디자인 방향
12.1 전체 톤앤매너
귀엽고 단순한 다이어리 앱 느낌
너무 다이어트 앱처럼 압박감을 주지 않기
사용자의 행동을 비난하지 않는 문구 사용
기록 자체를 즐겁게 만드는 방향
추천 문구
“오늘의 간식 기록”
“간식 먹었으면 가볍게 체크해요”
“기록만 해도 충분히 잘하고 있어요”
“내 패턴을 알아가는 중이에요”
12.2 메인 컬러
크림색
연한 베이지
파스텔 오렌지
브라운 포인트 컬러
이유
간식, 캐릭터, 다이어리 앱과 잘 어울림
부담스럽지 않고 따뜻한 느낌 제공
12.3 모바일 최적화
버튼은 엄지로 누르기 쉽게 크게 배치
캐릭터는 화면 중앙에 크게 표시
히스토리 그래프는 좌우 스크롤 또는 최근 7일 기본 표시
하단 네비게이션 사용 추천