const mockKeywords = ['focus', 'repeat', 'listen', 'shadowing'];

export function useSpinnerMode() {
  return {
    sessionTitle: 'Spinner practice session',
    activeKeyword: mockKeywords[0],
    keywords: mockKeywords,
    isRunning: false,
    startSession: () => undefined,
    pauseSession: () => undefined,
  };
}
