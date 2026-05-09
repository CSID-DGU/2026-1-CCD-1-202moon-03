import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { RainCaptionDisplay } from './types';

export interface RainCaptionInputHandle {
  focusPrimaryInput: () => void;
}

interface RainCaptionInputProps {
  items: RainCaptionDisplay['items'];
  fallbackText: string;
  onChange: (blankKey: string, value: string) => void;
  onSubmit: (blankKey: string) => void;
}

const RainCaptionInput = forwardRef<RainCaptionInputHandle, RainCaptionInputProps>(
  ({ items, fallbackText, onChange, onSubmit }, ref) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const primaryInputKey = useMemo(
      () =>
        items.find((item) => item.type === 'input' && item.resolvedState === 'pending')?.key ?? null,
      [items],
    );

    const focusPrimaryInput = () => {
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
    };

    useImperativeHandle(
      ref,
      () => ({
        focusPrimaryInput,
      }),
      [primaryInputKey],
    );

    useEffect(() => {
      if (!primaryInputKey) {
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
      if (activeInput && activeInput.dataset.blankKey !== primaryInputKey) {
        focusPrimaryInput();
      }
    }, [items, primaryInputKey]);

    return (
      <div ref={rootRef} className="flex flex-wrap items-center gap-[9px]">
        {items.length === 0 ? (
          fallbackText ? (
            <p className="text-[22px] font-semibold leading-[1.5] text-white">{fallbackText}</p>
          ) : null
        ) : (
          items.map((item) =>
            item.type === 'text' ? (
              <p key={item.key} className="text-[22px] font-semibold leading-[1.5] text-white">
                {item.text}
              </p>
            ) : (
              <input
                key={item.key}
                ref={(node) => {
                  inputRefs.current[item.key] = node;
                }}
                data-blank-key={item.key}
                type="text"
                value={item.value}
                placeholder={item.placeholder}
                onChange={(event) => onChange(item.key, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') {
                    return;
                  }

                  event.preventDefault();
                  onSubmit(item.key);
                  requestAnimationFrame(() => {
                    focusPrimaryInput();
                  });
                }}
                className={`w-[100px] rounded-[8px] border px-[14px] py-[8px] text-center font-semibold leading-[1.5] outline-none placeholder:text-[#9CA3AF] ${
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
