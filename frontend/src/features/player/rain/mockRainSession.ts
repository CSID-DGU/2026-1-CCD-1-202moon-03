import type { PlaybackRate, RainCaption } from './types';

export const rainSpeedOptions: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const mockRainSession = {
  title: '집중호우 모드',
  lessonTitle: '우리는 왜 역사를 공부하는가',
  duration: 212,
  defaultVideoUrl: 'https://www.youtube.com/watch?v=1Sp3EuDlZgM&list=PLE7ogCa1_I6suFmGQa5-Uj_ZF4H1KdMZw',
  youtubeEmbedUrl:
    'https://www.youtube.com/embed/1Sp3EuDlZgM?list=PLE7ogCa1_I6suFmGQa5-Uj_ZF4H1KdMZw&rel=0&modestbranding=1&cc_load_policy=1&hl=ko',
  characterName: '캐릭터',
  introText: '영상 속 핵심 키워드를 실시간으로 입력하면서 빈칸을 완성해 보세요.',
  keywordPool: [
    { id: 'kw-1', text: '역사', hint: '과거의 사건과 흐름을 배우는 분야', lane: 0 },
    { id: 'kw-2', text: '기록', hint: '사실을 남겨 두는 행위', lane: 2 },
    { id: 'kw-3', text: '맥락', hint: '사건이 놓인 배경과 연결', lane: 1 },
    { id: 'kw-4', text: '해석', hint: '자료를 이해하고 의미를 찾는 과정', lane: 3 },
    { id: 'kw-5', text: '교훈', hint: '과거에서 얻는 배움', lane: 0 },
  ],
  captions: [
    {
      start: 0,
      end: 38,
      text: '우리는 단순히 연도를 외우기 위해서가 아니라, 지금을 이해하기 위해 역사를 공부합니다.',
    },
    {
      start: 38,
      end: 86,
      text: '하나의 사건은 항상 그 시대의 맥락 안에서 읽어야 하고, 기록을 통해 더 선명하게 보입니다.',
    },
    {
      start: 86,
      end: 142,
      text: '역사는 과거의 결과를 해석하는 과정이며, 오늘의 선택에 필요한 교훈을 남겨 줍니다.',
    },
    {
      start: 142,
      end: 212,
      text: '핵심 키워드를 붙잡고 내용을 따라가면 긴 강의도 훨씬 능동적으로 학습할 수 있습니다.',
    },
  ] satisfies RainCaption[],
};
