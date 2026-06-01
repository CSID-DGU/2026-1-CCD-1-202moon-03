import {
  useCallback,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RainCaptionDisplay } from './types';

export interface RainCaptionInputHandle {
  focusPrimaryInput: () => void;
  focusBlankByKey: (blankKey: string) => void;
  focusNextPendingInput: (afterBlankKey: string) => void;
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
  onCommit: (blankKey: string, value: string) => void;
  onSubmit: (blankKey: string, value: string) => void;
  onCompositionStateChange?: (blankKey: string | null, isComposing: boolean) => void;
  onFocusBlankKeyChange?: (blankKey: string | null) => void;
  onInputLayoutChange?: (positions: Record<string, number>) => void;
  onDebugStateChange?: (state: {
    primaryInputKey: string | null;
    draftValuesByKey: Record<string, string>;
    lastAutoFocusReason: string | null;
  }) => void;
}

const RainCaptionInput = forwardRef<RainCaptionInputHandle, RainCaptionInputProps>(
  (
    {
      items,
      fallbackText,
      measurementRoot,
      allowWrap = false,
      onCommit,
      onSubmit,
      onCompositionStateChange,
      onFocusBlankKeyChange,
      onInputLayoutChange,
      onDebugStateChange,
    },
    ref,
  ) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const isComposingRef = useRef(false);
    const previousPrimaryInputKeyRef = useRef<string | null>(null);
    const composingBlankKeyRef = useRef<string | null>(null);
    const lastAutoFocusReasonRef = useRef<string | null>(null);
    const pendingSubmitFocusRef = useRef<string | null>(null);
    const [draftValuesByKey, setDraftValuesByKey] = useState<Record<string, string>>({});

    const inputItems = useMemo(
      () =>
        items.filter(
          (item): item is Extract<RainCaptionDisplay['items'][number], { type: 'input' }> =>
            item.type === 'input',
        ),
      [items],
    );
    const inputKeys = useMemo(() => inputItems.map((item) => item.key), [inputItems]);
    const pendingInputKeys = useMemo(
      () => inputItems.filter((item) => item.resolvedState === 'pending').map((item) => item.key),
      [inputItems],
    );
    const primaryInputKey = pendingInputKeys[0] ?? null;

    const focusInput = useCallback((blankKey: string, reason?: string) => {
      const input = inputRefs.current[blankKey];
      if (!input) {
        return false;
      }

      lastAutoFocusReasonRef.current = reason ?? 'manual';
      input.focus();
      const nextCursorPosition = input.value.length;
      input.setSelectionRange(nextCursorPosition, nextCursorPosition);
      return true;
    }, []);

    const focusPrimaryInput = useCallback((reason?: string) => {
      if (!primaryInputKey) {
        return;
      }

      focusInput(primaryInputKey, reason);
    }, [focusInput, primaryInputKey]);

    const focusBlankByKey = useCallback(
      (blankKey: string, reason?: string) => {
        focusInput(blankKey, reason);
      },
      [focusInput],
    );

    const focusNextPendingInput = useCallback(
      (afterBlankKey: string, reason?: string) => {
        const pendingSet = new Set(pendingInputKeys);
        const startIndex = inputKeys.indexOf(afterBlankKey);

        if (startIndex >= 0) {
          for (let index = startIndex + 1; index < inputKeys.length; index += 1) {
            const nextKey = inputKeys[index];
            if (pendingSet.has(nextKey) && focusInput(nextKey, reason ?? 'next_pending_input')) {
              return true;
            }
          }
        }

        if (primaryInputKey && primaryInputKey !== afterBlankKey) {
          return focusInput(primaryInputKey, reason ?? 'primary_fallback');
        }

        return false;
      },
      [focusInput, inputKeys, pendingInputKeys, primaryInputKey],
    );

    useImperativeHandle(
      ref,
      () => ({
        focusPrimaryInput,
        focusBlankByKey: (blankKey: string) => focusBlankByKey(blankKey, 'imperative_focus_by_key'),
        focusNextPendingInput: (afterBlankKey: string) =>
          void focusNextPendingInput(afterBlankKey, 'imperative_focus_next_pending'),
      }),
      [focusBlankByKey, focusNextPendingInput, focusPrimaryInput],
    );

    const commitDraftValue = useCallback(
      (blankKey: string, fallbackValue: string) => {
        onCommit(blankKey, inputRefs.current[blankKey]?.value ?? draftValuesByKey[blankKey] ?? fallbackValue);
      },
      [draftValuesByKey, onCommit],
    );

    useEffect(() => {
      const activeKeys = new Set(inputItems.map((item) => item.key));

      setDraftValuesByKey((current) => {
        let changed = false;
        const next: Record<string, string> = {};

        for (const item of inputItems) {
          const hasCurrentDraft = Object.prototype.hasOwnProperty.call(current, item.key);
          const nextValue = item.resolvedState === 'pending'
            ? hasCurrentDraft
              ? current[item.key] ?? ''
              : item.value
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

    useLayoutEffect(() => {
      const submittedBlankKey = pendingSubmitFocusRef.current;
      if (!submittedBlankKey || isComposingRef.current) {
        return;
      }

      const submittedItem = inputItems.find((item) => item.key === submittedBlankKey);
      if (submittedItem?.resolvedState === 'pending') {
        focusBlankByKey(submittedBlankKey, 'submit_restore_same');
        pendingSubmitFocusRef.current = null;
        return;
      }

      focusNextPendingInput(submittedBlankKey, 'submit_focus_next');
      pendingSubmitFocusRef.current = null;
    }, [focusBlankByKey, focusNextPendingInput, inputItems]);

    useLayoutEffect(() => {
      if (!primaryInputKey) {
        isComposingRef.current = false;
        composingBlankKeyRef.current = null;
        previousPrimaryInputKeyRef.current = null;
        lastAutoFocusReasonRef.current = null;
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
        focusPrimaryInput(primaryInputChanged ? 'new_primary_input' : 'restore_focus_outside');
        return;
      }

      const activeInput = activeElement as HTMLInputElement | null;
      if (primaryInputChanged && activeInput && activeInput.dataset.blankKey !== primaryInputKey) {
        focusPrimaryInput('switch_primary_input');
      }
    }, [focusPrimaryInput, onCompositionStateChange, onFocusBlankKeyChange, primaryInputKey]);

    useEffect(() => {
      onDebugStateChange?.({
        primaryInputKey,
        draftValuesByKey,
        lastAutoFocusReason: lastAutoFocusReasonRef.current,
      });
    }, [draftValuesByKey, onDebugStateChange, primaryInputKey]);

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

    const renderedItems =
      items.length === 0
        ? fallbackText
          ? (
              <p
                className={`m-0 text-[22px] font-semibold leading-[1.45] text-[#F8FAFC] ${
                  allowWrap ? 'whitespace-normal [word-break:keep-all]' : 'whitespace-nowrap'
                }`}
              >
                {fallbackText}
              </p>
            )
          : null
        : items.map((item) =>
            item.type === 'text' ? (
              <span
                key={item.key}
                className={`text-[#F8FAFC] ${
                  allowWrap ? 'whitespace-normal [word-break:keep-all]' : 'whitespace-nowrap'
                }`}
              >
                {item.text}
              </span>
            ) : (
              <input
                key={item.renderKey ?? item.key}
                ref={(node) => {
                  inputRefs.current[item.key] = node;
                }}
                data-blank-key={item.key}
                type="text"
                autoFocus={item.key === primaryInputKey}
                value={draftValuesByKey[item.key] ?? item.value}
                placeholder={item.placeholder}
                readOnly={item.resolvedState !== 'pending'}
                onFocus={() => {
                  onFocusBlankKeyChange?.(item.key);
                }}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  lastAutoFocusReasonRef.current = 'user_input';
                  setDraftValuesByKey((current) => ({
                    ...current,
                    [item.key]: nextValue,
                  }));
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                  composingBlankKeyRef.current = item.key;
                  lastAutoFocusReasonRef.current = 'composition_start';
                  onCompositionStateChange?.(item.key, true);
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                  composingBlankKeyRef.current = null;
                  lastAutoFocusReasonRef.current = 'composition_end';
                  onCompositionStateChange?.(item.key, false);
                }}
                onBlur={() => {
                  isComposingRef.current = false;
                  composingBlankKeyRef.current = null;
                  lastAutoFocusReasonRef.current = 'blur_commit';
                  commitDraftValue(item.key, item.value);
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
                  const submitValue =
                    inputRefs.current[item.key]?.value ?? draftValuesByKey[item.key] ?? item.value;
                  pendingSubmitFocusRef.current = item.key;
                  onCommit(item.key, submitValue);
                  onSubmit(item.key, submitValue);
                }}
                style={{ width: `${getAnswerBoxWidth(getCompactAnswerLength(item.blank.keyword))}px` }}
                className={`${allowWrap ? 'ml-0 mr-1 my-[2px]' : 'mx-1'} inline-block h-[42px] w-[100px] shrink-0 rounded-[8px] border px-[10px] py-0 align-middle text-center text-[18px] font-semibold leading-[40px] outline-none translate-y-[-1px] placeholder:text-[18px] placeholder:leading-[40px] placeholder:text-[#9CA3AF] ${
                  item.resolvedState === 'cleared'
                    ? 'border-[#16A34A] bg-[#F0FDF4] text-[#166534]'
                    : item.resolvedState === 'missed'
                      ? 'border-[#DC2626] bg-[#FFF1F2] text-[#BE123C]'
                      : 'border-[#032E4E] bg-white text-[#15171C]'
                }`}
              />
            ),
          );

    return (
        <div
          ref={rootRef}
          className={`min-w-full font-semibold text-[#F8FAFC] ${
            allowWrap
              ? 'block text-left text-[21px] leading-[1.4] tracking-[-0.01em]'
              : 'inline-flex items-center whitespace-nowrap text-[22px] leading-[1.45]'
          }`}
        >
          {allowWrap ? (
            <div className="max-w-[96%] whitespace-normal text-left align-top leading-[1.4] [word-break:keep-all]">
              {renderedItems}
            </div>
          ) : (
          renderedItems
        )}
      </div>
    );
  },
);

RainCaptionInput.displayName = 'RainCaptionInput';

export default RainCaptionInput;
