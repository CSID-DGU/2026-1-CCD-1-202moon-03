## 프로젝트 개요

이 프로젝트는 Vite + React + TypeScript 기반으로 구성된 학습 서비스 프론트엔드입니다.

- 영상 URL 또는 파일 기반 학습 진입
- `Spinner` / `Rain` 두 가지 인터랙티브 학습 모드 제공
- 학습 결과 요약, 키워드 하이라이트, 퀴즈 다시 풀기 UI 제공
- 로그인, 회원가입, 마이페이지, 학습 기록 화면 구성
- Axios + Zustand 기반 인증 상태 및 API 통신 관리

## 기술 스택

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Axios
- Tailwind CSS

## 주요 기능

### 1. 인증

- 로그인 / 회원가입 화면 제공
- 액세스 토큰 기반 인증 상태 유지
- 리프레시 토큰 재발급 인터셉터 처리

### 2. 학습 영상 관리

- 영상 URL 입력 또는 파일 업로드 UI
- 학습 영상 목록 조회 및 카드형 목록 표시
- 영상 제목 수정 / 삭제 UI

### 3. 학습 모드

- `Spinner Mode`
  - 재생 속도 및 자막 제어
  - 키보드/휠 기반 인터랙션

- `Rain Mode`
  - 재생 속도 및 자막 제어
  - 떨어지는 키워드 입력형 학습
  - 점수, 콤보, 정확도 계산

### 4. 결과 및 마이페이지

- AI 요약 결과 표시
- 키워드 하이라이트 제공
- 퀴즈 다시 풀기 및 영상 다시 보기 흐름 지원
- 사용자 프로필 및 학습 기록 화면 제공

## 폴더 구조

```text
frontend/
├─ src/
│  ├─ assets/        # 폰트, 아이콘, 이미지
│  ├─ components/    # 공통 UI 및 레이아웃 컴포넌트
│  ├─ constants/     # 라우트 상수 등
│  ├─ features/      # 도메인별 기능 단위 UI/훅
│  ├─ hooks/         # 공통 커스텀 훅
│  ├─ pages/         # 라우트 페이지
│  ├─ router/        # 라우터 설정
│  ├─ services/      # API 클라이언트 및 엔드포인트 함수
│  ├─ store/         # Zustand 스토어
│  ├─ styles/        # 전역 스타일
│  ├─ types/         # 타입 정의
│  └─ utils/         # 유틸 함수
```

## 시작하기

현재는 백엔드 연동 전 단계이므로, 프론트엔드 화면을 로컬에서 실행해 확인할 수 있습니다.

### 1. 저장소 클론

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_NAME>/frontend
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 브라우저에서 확인

기본적으로 아래 주소에서 확인할 수 있습니다.

```text
http://localhost:5173
```

## 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 타입 체크 후 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 라우트

현재 주요 페이지는 아래와 같습니다.

- `/` : 온보딩
- `/home` : 학습 영상 목록
- `/login` : 로그인
- `/signup` : 회원가입
- `/mypage` : 마이페이지
- `/result` : 학습 결과
- `/player/spinner` : Spinner 모드
- `/player/rain` : Rain 모드

## API 연동

- API 통신은 `src/services`에서 관리합니다.
- 공통 Axios 인스턴스는 `src/services/apiClient.ts`에서 설정합니다.
- 인증 만료 시 리프레시 토큰으로 재발급을 시도하고, 실패하면 로그인 페이지로 이동합니다.
- 세션 상태 폴링 훅은 `src/hooks/useSessionPolling.ts`에서 관리합니다.

## 참고 사항

- 현재 프로젝트에는 별도 테스트 스크립트가 포함되어 있지 않습니다.
- 일부 학습 모드 UI는 목업 데이터 기반으로 동작하는 화면이 포함되어 있습니다.
- 현재 백엔드 API와의 연결은 완료되지 않았습니다.
- 백엔드 연동 이후 `.env` 파일에 API 주소를 설정할 예정입니다.
- 실제 배포 전에는 백엔드 API 주소, 인증 정책, 업로드 정책을 함께 점검할 예정입니다.

## 백엔드 저장소 링크

- https://github.com/CSID-DGU/2026-1-CCD-1-202moon-03-be