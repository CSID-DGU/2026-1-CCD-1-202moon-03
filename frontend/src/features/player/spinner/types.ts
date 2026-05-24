export type SpinnerAssistTool = 'spinner' | 'keycap';
export type SpinnerPlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
export type KeycapVisualState = 'idle' | 'pressed' | 'releasing';
export type KeycapButtonVariant = 'spinner' | 'default';

export interface SpinnerCaption {
  start: number;
  end: number;
  text: string;
}
