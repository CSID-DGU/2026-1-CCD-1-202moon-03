import { useRef, useState, type DragEvent, type FormEvent, type MouseEvent } from 'react';
import Button from '../../components/ui/Button';
import { useVideoInput, type VideoInputSubmitPayload } from './useVideoInput';

interface VideoInputFormProps {
  submitLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: VideoInputSubmitPayload) => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)}MB`;
}

function getFileTypeLabel(file: File) {
  const normalizedName = file.name.toLowerCase();

  if (file.type === 'video/webm' || normalizedName.endsWith('.webm')) {
    return 'WEBM';
  }

  return 'MP4';
}

function VideoInputForm({
  submitLabel = '완료',
  isSubmitting = false,
  onCancel,
  onSubmit,
}: VideoInputFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const {
    values,
    canSubmit,
    isUrlDisabled,
    isFileDisabled,
    fileError,
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

  const handleFileDragOver = (event: DragEvent<HTMLLabelElement>) => {
    if (isFileDisabled) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingFile(false);
  };

  const handleFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    if (isFileDisabled) {
      return;
    }

    event.preventDefault();
    setIsDraggingFile(false);
    setFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleSelectAnotherFile = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setFile(null);
  };

  return (
    <form className="space-y-5" onSubmit={onFormSubmit}>
      <div className="relative">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[26px] text-[#C6CDD9]">
          →
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
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
        className={`flex min-h-[292px] cursor-pointer flex-col rounded-[18px] border px-8 py-8 transition-colors ${
          isFileDisabled
            ? 'border-[#DCE1EA] bg-[#F7F9FC] opacity-70'
            : values.file
              ? 'border-[#BFD9F8] bg-[#F4F9FF]'
              : isDraggingFile
                ? 'border-[#1A9AF5] bg-[#EEF6FF]'
                : 'border-[#DCE1EA] bg-[#F7F9FC] hover:border-[#C8D8F3]'
        }`}
      >
        <input
          ref={fileInputRef}
          id="home-video-file"
          name="videoFile"
          type="file"
          accept=".mp4,.webm,video/mp4,video/webm"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          disabled={isFileDisabled}
          className="hidden"
        />

        {values.file ? (
          <div className="flex h-full flex-col">
            <div className="inline-flex self-start rounded-full bg-white/90 px-3 py-1 text-[13px] font-semibold text-[#1A9AF5] shadow-[0_6px_16px_rgba(26,154,245,0.08)]">
              파일 선택 완료
            </div>

            <div className="mt-6 flex flex-1 flex-col justify-center rounded-[20px] border border-[#D8E8FB] bg-white px-6 py-6 shadow-[0_18px_36px_rgba(26,154,245,0.08)]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#EAF5FF] text-[#1A9AF5]">
                  <VideoFileIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-left text-[18px] font-semibold text-[#1F2430]">
                    {values.file.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] font-medium text-[#6C7485]">
                    <span className="rounded-full bg-[#F3F7FC] px-3 py-1 text-[#4B5565]">
                      {getFileTypeLabel(values.file)}
                    </span>
                    <span>{formatFileSize(values.file.size)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAnotherFile}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#D7E4F5] bg-white px-4 text-[15px] font-medium text-[#356DAA] transition-colors hover:bg-[#F7FBFF]"
                >
                  다른 파일 선택
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="inline-flex h-11 items-center justify-center rounded-full px-2 text-[15px] font-medium text-[#8A94A8] transition-colors hover:text-[#596376]"
                >
                  제거
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <UploadIcon />
            <p className="mt-5 text-[17px] font-semibold text-[#C0C7D4]">파일 업로드</p>
            <p className="mt-3 text-[16px] leading-[1.45] text-[#CAD0DB]">
              파일을 첨부하거나 원하는 파일을 마우스로 끌어다 놓으세요.
            </p>
            <p className="mt-6 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#8A94A8] shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
              MP4, WEBM 지원
            </p>
          </div>
        )}

        {fileError ? <p className="mt-4 text-[14px] font-medium text-rose-500">{fileError}</p> : null}
      </label>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          variant={!canSubmit || isSubmitting ? 'inactive' : 'active'}
          className="h-[64px] w-full rounded-[12px] text-[20px]"
        >
          {submitLabel}
        </Button>
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

function VideoFileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V7L14 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3V7H18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 10.5L15 13.5L10 16.5V10.5Z" fill="currentColor" />
    </svg>
  );
}

export default VideoInputForm;
