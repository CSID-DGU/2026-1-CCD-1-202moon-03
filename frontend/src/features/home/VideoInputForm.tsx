import type { FormEvent } from 'react';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useVideoInput, type VideoInputSubmitPayload } from './useVideoInput';

interface VideoInputFormProps {
  submitLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: VideoInputSubmitPayload) => void;
}

function VideoInputForm({
  submitLabel = '완료',
  isSubmitting = false,
  onCancel,
  onSubmit,
}: VideoInputFormProps) {
  const {
    values,
    canSubmit,
    isUrlDisabled,
    isFileDisabled,
    setUrl,
    setFile,
    reset,
    handleSubmit: submitVideoInput,
  } = useVideoInput();

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = submitVideoInput();

    if (!payload) {
      return;
    }

    onSubmit(payload);
    reset();
  };

  return (
    <form className="space-y-5" onSubmit={onFormSubmit}>
      <div className="relative">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[26px] text-[#C6CDD9]">
          ⛓
        </span>
        <input
          id="home-video-url"
          name="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/"
          value={values.url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={isUrlDisabled}
          className="h-[68px] w-full rounded-[16px] border border-[#DCE1EA] bg-white pl-[58px] pr-5 text-[18px] text-[#2A3140] outline-none transition-colors placeholder:text-[#B8BFCC] focus:border-[#C5D9F7] disabled:bg-[#F5F7FA] disabled:text-[#A3ACBA]"
        />
      </div>

      <label
        className={`flex min-h-[292px] cursor-pointer flex-col items-center justify-center rounded-[18px] border border-[#DCE1EA] bg-[#F7F9FC] px-8 text-center transition-colors ${
          isFileDisabled ? 'opacity-70' : 'hover:border-[#C8D8F3]'
        }`}
      >
        <input
          id="home-video-file"
          name="videoFile"
          type="file"
          accept="video/*,audio/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          disabled={isFileDisabled}
          className="hidden"
        />
        <UploadIcon />
        <p className="mt-5 text-[17px] font-semibold text-[#C0C7D4]">파일 업로드</p>
        <p className="mt-3 text-[16px] leading-[1.45] text-[#CAD0DB]">
          파일을 첨부하거나 원하는 파일을 마우스로 끌어오세요.
        </p>
        {values.file ? (
          <p className="mt-5 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#63708A] shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            {values.file.name}
          </p>
        ) : null}
      </label>

      <div className="pt-4">
        <PrimaryButton
          type="submit"
          disabled={!canSubmit || isSubmitting}
          variant={!canSubmit || isSubmitting ? 'disabled' : 'active'}
        >
          {submitLabel}
        </PrimaryButton>
      </div>

      {onCancel ? (
        <button type="button" onClick={onCancel} className="hidden">
          취소
        </button>
      ) : null}
    </form>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="h-10 w-10 text-[#C8D0DD]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 26.667V10M20 10L14.167 15.833M20 10L25.833 15.833"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 29.167C10 30.0875 10.7462 30.833 11.667 30.833H28.333C29.2535 30.833 30 30.0875 30 29.167"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default VideoInputForm;
