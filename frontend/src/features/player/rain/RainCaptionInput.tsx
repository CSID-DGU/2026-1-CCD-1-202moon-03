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

interface RainCaptionInputProps {
  items: RainCaptionDisplay['items'];
  fallbackText: string;
  onChange: (blankKey: string, value: string) => void;
  onSubmit: (blankKey: string, value: string) => void;
  onCompositionStateChange?: (blankKey: string | null, isComposing: boolean) => void;
  onFocusBlankKeyChange?: (blankKey: string | null) => void;
}

const RainCaptionInput = forwardRef<RainCaptionInputHandle, RainCaptionInputProps>(
  (
    {
      items,
      fallbackText,
      onChange,
      onSubmit,
      onCompositionStateChange,
      onFocusBlankKeyChange,
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

    return (
      <div
        ref={rootRef}
        className="break-keep text-[22px] font-semibold leading-[1.7] text-white whitespace-pre-wrap"
      >
        {items.length === 0 ? (
          fallbackText ? (
            <p className="text-[22px] font-semibold leading-[1.7] text-white">{fallbackText}</p>
          ) : null
        ) : (
          items.map((item) =>
            item.type === 'text' ? (
              <span
                key={item.key}
                className="break-keep whitespace-pre-wrap text-white"
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
                className={`mx-1 inline-block w-[100px] rounded-[8px] border px-[10px] py-[6px] text-center text-[18px] font-semibold leading-[1.2] outline-none placeholder:text-[18px] placeholder:text-[#9CA3AF] ${
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
