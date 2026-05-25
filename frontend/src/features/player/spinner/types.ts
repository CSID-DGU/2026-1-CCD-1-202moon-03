export type SpinnerAssistTool = 'spinner' | 'keycap';
export type SpinnerPlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
export type KeycapVisualState = 'idle' | 'pressed' | 'releasing';
export type KeycapButtonVariant = 'spinner' | 'default';
export type KeycapGlowTheme = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
export type MascotVisualState = 'default' | 'hover' | 'pressed';
export type MascotPromptType = 'none' | 'stretch' | 'focus-return';

export interface SpinnerCaption {
  start: number;
  end: number;
  text: string;
}
