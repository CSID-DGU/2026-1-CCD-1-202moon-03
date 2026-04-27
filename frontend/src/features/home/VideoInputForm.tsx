import type { FormEvent } from 'react';
import FormField from '../../components/form/FormField';
import InputField from '../../components/form/InputField';
import PrimaryButton from '../../components/ui/PrimaryButton';
import type { VideoInputValues } from './useVideoInput';

interface VideoInputFormProps {
  values: VideoInputValues;
  onYoutubeUrlChange: (value: string) => void;
  onAudioFileChange: (file: File | null) => void;
  onPersonalVideoLinkChange: (value: string) => void;
  onSubmit: () => void;
}

function VideoInputForm({
  values,
  onYoutubeUrlChange,
  onAudioFileChange,
  onPersonalVideoLinkChange,
  onSubmit,
}: VideoInputFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      className="space-y-6 rounded-[28px] bg-white px-6 py-7 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
      onSubmit={handleSubmit}
    >
      <FormField
        label="YouTube URL"
        htmlFor="home-youtube-url"
        description="Paste the lecture or study video link for later API integration."
      >
        <InputField
          id="home-youtube-url"
          name="youtubeUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={values.youtubeUrl}
          onChange={(event) => onYoutubeUrlChange(event.target.value)}
          variant={values.youtubeUrl ? 'filled' : 'default'}
        />
      </FormField>

      <FormField
        label="Lecture Recording Upload"
        htmlFor="home-audio-file"
        description="Upload an audio recording file to reserve the upload flow."
      >
        <input
          id="home-audio-file"
          name="audioFile"
          type="file"
          accept="audio/*"
          onChange={(event) => onAudioFileChange(event.target.files?.[0] ?? null)}
          className="block w-full rounded-[12px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600"
        />
      </FormField>

      <FormField
        label="Personal Video Link"
        htmlFor="home-personal-video-link"
        description="Reserve a field for personal or cloud-hosted video links."
      >
        <InputField
          id="home-personal-video-link"
          name="personalVideoLink"
          type="url"
          placeholder="https://example.com/my-video"
          value={values.personalVideoLink}
          onChange={(event) => onPersonalVideoLinkChange(event.target.value)}
          variant={values.personalVideoLink ? 'filled' : 'default'}
        />
      </FormField>

      <PrimaryButton type="submit" disabled={false} variant="active">
        Continue
      </PrimaryButton>
    </form>
  );
}

export default VideoInputForm;
