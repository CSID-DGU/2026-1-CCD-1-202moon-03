export const RAIN_DIFFICULTY_PRESETS = {
  easy: {
    manual: {
      blankCount: 1,
      speedLevel: 1,
    },
    auto: {
      activeBlanks: 1 as const,
      samplingStep: 3 as const,
      fallSpeedMultiplier: 0.7,
      fallLeadTimeOffset: 0.4,
      missGraceSeconds: 1.5,
    },
    gameplay: {
      minFallDuration: 7.0,
      segmentSampleRate: 3 as const,
    },
  },
  normal: {
    manual: {
      blankCount: 2,
      speedLevel: 2,
    },
    auto: {
      activeBlanks: 2 as const,
      samplingStep: 2 as const,
      fallSpeedMultiplier: 0.9,
      fallLeadTimeOffset: 0.2,
      missGraceSeconds: 1.2,
    },
    gameplay: {
      minFallDuration: 6.0,
      segmentSampleRate: 2 as const,
    },
  },
  hard: {
    manual: {
      blankCount: 2,
      speedLevel: 4,
    },
    auto: {
      activeBlanks: 2 as const,
      samplingStep: 1 as const,
      fallSpeedMultiplier: 1.1,
      fallLeadTimeOffset: 0,
      missGraceSeconds: 1.0,
    },
    gameplay: {
      minFallDuration: 5.0,
      segmentSampleRate: 1 as const,
    },
  },
} as const;

export type RainDifficultyPresetKey = keyof typeof RAIN_DIFFICULTY_PRESETS;
