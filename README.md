# 🌧️ TADAC — 202moon

> **2026-1 동국대학교 융합캡스톤디자인 03팀 202moon**의 TADAC 통합 레포지토리입니다.
>
> 배포 주소: https://2026-1-ccd-1-202moon-03.vercel.app

---

## 📌 프로젝트 소개

**TADAC**은 유튜브 강의 영상을 기반으로 한 **AI 기반 능동적 학습 플랫폼**입니다.

단순히 영상을 수동적으로 시청하는 것을 넘어, **피젯 모드**와 **집중호우 모드** 두 가지 인터랙티브 학습 경험을 제공해 집중력과 학습 효율을 높입니다.

- 🎥 유튜브 URL 입력 또는 영상 업로드
- 🧠 AI가 핵심 키워드 추출 및 학습 데이터 생성
- 🌀 **피젯 모드**: 영상 시청 중 피젯스피너/키캡으로 손 자극 유지
- 🌧️ **집중호우 모드**: 키워드가 화면에 낙하 → 타이핑으로 받아치는 게임형 학습
- ⏱️ **뽀모도로 퀴즈**: 15~20분마다 자동 퀴즈 팝업으로 복습
- 📝 **학습 결과 & AI 정리본**: 세션 종료 후 GPT 기반 구조화 요약 제공
- 📊 **학습 대시보드**: 누적 학습 기록, 정확도, 주요 성과를 한눈에 확인

--- 

## 👩‍💻 팀원

| 역할 | 이름 |
|------|------|
| Backend | 임수빈 |
| AI | 김연비 |
| Frontend | 이규민 |
| PM | 정준희 |

---

## 🛠️ 기술 스택

### Backend / AI

| 분류 | 기술 |
|------|------|
| Language | Python 3.x |
| Framework | Django REST Framework |
| AI | OpenAI Whisper API, GPT API |
| Database | PostgreSQL |
| Auth | JWT (SimpleJWT) |

### Frontend

| 분류 | 기술 |
|------|------|
| Language | TypeScript |
| Framework | React 19 |
| Build Tool | Vite |
| Routing | React Router |
| State | Zustand |
| HTTP Client | Axios |
| Styling | Tailwind CSS |

---

## 📁 프로젝트 구조

```text
2026-1-CCD-1-202moon-03/
├── frontend/                 # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── assets/           # 폰트, 아이콘, 이미지
│   │   ├── components/       # 공통 UI 컴포넌트
│   │   ├── constants/        # 상수, 라우트 정의
│   │   ├── features/         # 기능 단위 UI / 훅 / 로직
│   │   ├── hooks/            # 공통 커스텀 훅
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── router/           # 라우터 설정
│   │   ├── services/         # API 통신 레이어
│   │   ├── store/            # Zustand 스토어
│   │   ├── styles/           # 전역 스타일
│   │   ├── types/            # 타입 정의
│   │   └── utils/            # 유틸 함수
├── ai_backend/               # AI 백엔드 (별도 레포)
│   ├── api.py                # FastAPI 웹 서버 진입점 및 HTTP 라우팅
│   ├── pipeline.py           # STT -> 교정 -> 키워드 -> 쇼츠 핵심 파이프라인
│   ├── stt.py                # Whisper 기반 음성 인식 모듈
│   ├── transcript_refiner.py # GPT 기반 자막 교정
│   ├── combined_processor.py # STT 결과와 키워드 매핑
│   ├── shorts_generator.py   # 쇼츠 비디오/대본 생성
│   ├── shorts_builder.py     # 쇼츠 비디오/대본 생성
│   ├── youtube_audio.py      # YouTube 오디오 다운로드 및 처리
│   ├── youtube_subtitle.py   # YouTube 자막 다운로드 및 처리
│   ├── AI_SPEC.md            # AI 연동 명세서
│   └── BACKEND_HANDOFF.md    # 백엔드 연동 주의사항
├── tadac_backend/            # Django 백엔드 (별도 레포)
│   ├── auth/                 # 인증 (회원가입, 로그인, 토큰)
│   ├── users/                # 유저 프로필, 환경설정
│   ├── sessions/             # 학습 세션 관리
│   ├── game/                 # 집중호우 모드 게임 로직
│   ├── quiz/                 # 뽀모도로 퀴즈
│   ├── analytics/            # 학습 결과 및 기록
│   ├── common/               # 공통 모듈
│   ├── logs/                 # 로그 관리
│   ├── project/              # Django 프로젝트 설정
│   └── manage.py
└── README.md
```

- AI는 별도 레포에서 관리합니다: https://github.com/KimYeonBee/2026-1-CCD-1-202moon-03-ai/tree/master
- 백엔드는 별도 레포에서 관리합니다: https://github.com/CSID-DGU/2026-1-CCD-1-202moon-03-be

---

## ✨ 주요 기능 명세

### 🌀 피젯 모드

- 영상 재생 중 피젯스피너 / 키캡 모드 전환
- 마우스 휠 및 키 입력 기반 인터랙션
- 영상 재생 / 일시정지 / 배속 / 탐색 / 자막 제어

### 🌧️ 집중호우 모드

- Whisper STT 기반 단어별 타임스탬프 추출
- GPT 핵심 키워드 추출 및 타임스탬프 매핑
- 키워드 낙하 애니메이션과 자막 입력 동기화
- 타이핑 정답 판정 / 콤보 / 점수 / 정확도 계산
- 난이도 및 낙하 속도 조절

### 🧠 뽀모도로 퀴즈

- 15~20분 간격 자동 일시정지
- GPT 기반 객관식 퀴즈 생성
- 정답 / 오답 즉각 피드백

### 📊 학습 결과

- 시청 완료율, 총점, 콤보, 타이핑 정확도 제공
- 키워드 하이라이트 및 퀴즈 재도전
- GPT 기반 전체 내용 구조화 요약 제공

