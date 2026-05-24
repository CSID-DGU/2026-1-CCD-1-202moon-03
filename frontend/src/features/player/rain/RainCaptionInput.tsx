import {
  useCallback,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RainCaptionDisplay } from './types';

export interface RainCaptionInputHandle {
  focusPrimaryInput: () => void;
}

function getAnswerBoxWidth(answerLength: number) {
  return Math.max(100, answerLength * 22 + 20);
}

function getCompactAnswerLength(value: string) {
  return value.replace(/\s+/g, '').length;
}

interface RainCaptionInputProps {
  items: RainCaptionDisplay['items'];
  fallbackText: string;
  measurementRoot?: HTMLElement | null;
  allowWrap?: boolean;
  onChange: (blankKey: string, value: string) => void;
  onSubmit: (blankKey: string, value: string) => void;
  onCompositionStateChange?: (blankKey: string | null, isComposing: boolean) => void;
  onFocusBlankKeyChange?: (blankKey: string | null) => void;
  onInputLayoutChange?: (positions: Record<string, number>) => void;
}

const RainCaptionInput = forwardRef<RainCaptionInputHandle, RainCaptionInputProps>(
  (
    {
      items,
      fallbackText,
      measurementRoot,
      allowWrap = false,
      onChange,
      onSubmit,
      onCompositionStateChange,
      onFocusBlankKeyChange,
      onInputLayoutChange,
    },
    ref,
  ) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const isComposingRef = useRef(false);
    const previousPrimaryInputKeyRef = useRef<string | null>(null);
    const composingBlankKeyRef = useRef<string | null>(null);
    const [draftValuesByKey, setDraftValuesByKey] = useState<Record<string, string>>({});

    const primaryInputKey = useMemo(
      () =>
        items.find((item) => item.type === 'input' && item.resolvedState === 'pending')?.key ?? null,
      [items],
    );

    const focusPrimaryInput = useCallback(() => {
      if (!primaryInputKey) {
        return;
      }

      const input = inputRefs.current[primaryInputKey];
      if (!input) {
        return;
      }

      input.focus();
      const nextCursorPosition = input.value.length;
      input.setSelectionRange(nextCursorPosition, nextCursorPosition);
    }, [primaryInputKey]);

    useImperativeHandle(
      ref,
      () => ({
        focusPrimaryInput,
      }),
      [primaryInputKey],
    );

    useEffect(() => {
      const activeKeys = new Set(items.filter((item) => item.type === 'input').map((item) => item.key));
      const activeElement = document.activeElement as HTMLInputElement | null;
      const focusedBlankKey = rootRef.current?.contains(activeElement)
        ? activeElement?.dataset.blankKey ?? null
        : null;

      setDraftValuesByKey((current) => {
        let changed = false;
        const next: Record<string, string> = {};

        for (const item of items) {
          if (item.type !== 'input') {
            continue;
          }

          const isComposingCurrentInput =
            isComposingRef.current && composingBlankKeyRef.current === item.key;
          const isFocusedCurrentInput = focusedBlankKey === item.key;

          const nextValue =
            isComposingCurrentInput || isFocusedCurrentInput
              ? current[item.key] ?? item.value
              : item.value;
          next[item.key] = nextValue;

          if (current[item.key] !== nextValue) {
            changed = true;
          }
        }

        for (const key of Object.keys(current)) {
          if (!activeKeys.has(key)) {
            changed = true;
            break;
          }
        }

        return changed ? next : current;
      });
    }, [items]);

    useEffect(() => {
      if (!primaryInputKey) {
        isComposingRef.current = false;
        composingBlankKeyRef.current = null;
        previousPrimaryInputKeyRef.current = null;
        onCompositionStateChange?.(null, false);
        onFocusBlankKeyChange?.(null);
        return;
      }

      const primaryInputChanged = previousPrimaryInputKeyRef.current !== primaryInputKey;
      previousPrimaryInputKeyRef.current = primaryInputKey;

      if (isComposingRef.current) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const isFocusInsideRainInput = Boolean(
        activeElement && rootRef.current?.contains(activeElement),
      );

      if (!isFocusInsideRainInput) {
        focusPrimaryInput();
        return;
      }

      const activeInput = activeElement as HTMLInputElement | null;
      if (primaryInputChanged && activeInput && activeInput.dataset.blankKey !== primaryInputKey) {
        focusPrimaryInput();
      }
    }, [focusPrimaryInput, primaryInputKey]);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      let frameId = 0;

      const reportInputLayouts = () => {
        const rootElement = rootRef.current;
        if (!rootElement) {
          return;
        }

        const measurementRect = (measurementRoot ?? rootElement).getBoundingClientRect();
        if (measurementRect.width <= 0) {
          onInputLayoutChange?.({});
          return;
        }

        const nextPositions: Record<string, number> = {};

        for (const item of items) {
          if (item.type !== 'input') {
            continue;
          }

          const input = inputRefs.current[item.key];
          if (!input) {
            continue;
          }

          const inputRect = input.getBoundingClientRect();
          const centerX = inputRect.left + inputRect.width / 2 - measurementRect.left;
          nextPositions[item.key] = Math.min(Math.max(centerX, 0), measurementRect.width);
        }

        onInputLayoutChange?.(nextPositions);
      };

      const scheduleReport = () => {
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(reportInputLayouts);
      };

      scheduleReport();

      const resizeObserver =
        typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => scheduleReport()) : null;

      resizeObserver?.observe(root);
      Object.values(inputRefs.current).forEach((input) => {
        if (input) {
          resizeObserver?.observe(input);
        }
      });

      window.addEventListener('resize', scheduleReport);

      return () => {
        window.cancelAnimationFrame(frameId);
        resizeObserver?.disconnect();
        window.removeEventListener('resize', scheduleReport);
      };
    }, [items, measurementRoot, onInputLayoutChange]);

    return (
      <div
        ref={rootRef}
        className={`min-w-full items-center text-[22px] font-semibold leading-[1.45] text-white ${
          allowWrap ? 'flex flex-wrap gap-y-2 whitespace-normal' : 'inline-flex whitespace-nowrap'
        }`}
      >
        {items.length === 0 ? (
          fallbackText ? (
            <p
              className={`m-0 text-[22px] font-semibold leading-[1.45] text-white ${
                allowWrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'
              }`}
            >
              {fallbackText}
            </p>
          ) : null
        ) : (
          items.map((item) =>
            item.type === 'text' ? (
              <span
                key={item.key}
                className={`${allowWrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'} text-white`}
              >
                {item.text}
              </span>
            ) : (
              <input
                key={item.key}
                ref={(node) => {
                  inputRefs.current[item.key] = node;
                }}
                data-blank-key={item.key}
                type="text"
                value={draftValuesByKey[item.key] ?? item.value}
                placeholder={item.placeholder}
                readOnly={item.resolvedState !== 'pending'}
                onFocus={() => {
                  onFocusBlankKeyChange?.(item.key);
                }}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDraftValuesByKey((current) => ({
                    ...current,
                    [item.key]: nextValue,
                  }));

                  if (!isComposingRef.current || composingBlankKeyRef.current !== item.key) {
                    onChange(item.key, nextValue);
                  }
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                  composingBlankKeyRef.current = item.key;
                  onCompositionStateChange?.(item.key, true);
                }}
                onCompositionEnd={(event) => {
                  isComposingRef.current = false;
                  composingBlankKeyRef.current = null;
                  onCompositionStateChange?.(item.key, false);
                  onChange(item.key, event.currentTarget.value);
                }}
                onBlur={() => {
                  isComposingRef.current = false;
                  composingBlankKeyRef.current = null;
                  onCompositionStateChange?.(item.key, false);
                  onFocusBlankKeyChange?.(null);
                }}
                onKeyDown={(event) => {
                  if (isComposingRef.current || event.nativeEvent.isComposing) {
                    return;
                  }

                  if (event.key !== 'Enter') {
                    return;
                  }

                  event.preventDefault();
                  onSubmit(item.key, draftValuesByKey[item.key] ?? item.value);
                  requestAnimationFrame(() => {
                    focusPrimaryInput();
                  });
                }}
                style={{ width: `${getAnswerBoxWidth(getCompactAnswerLength(item.blank.keyword))}px` }}
                className={`mx-1 inline-block h-[42px] w-[100px] shrink-0 rounded-[8px] border px-[10px] py-[6px] align-middle text-center text-[18px] font-semibold leading-[1.2] outline-none placeholder:text-[18px] placeholder:text-[#9CA3AF] ${
                  item.resolvedState === 'cleared'
                    ? 'border-[#16A34A] bg-[#F0FDF4] text-[#166534]'
                    : item.resolvedState === 'missed'
                      ? 'border-[#DC2626] bg-[#FFF1F2] text-[#BE123C]'
                      : 'border-[#032E4E] bg-white text-[#15171C]'
                }`}
              />
            ),
          )
        )}
      </div>
    );
  },
);

RainCaptionInput.displayName = 'RainCaptionInput';

export default RainCaptionInput;
