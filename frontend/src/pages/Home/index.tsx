import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ROUTES } from '../../constants/routes';
import ModeSelect from '../../features/home/ModeSelect';
import VideoInputForm from '../../features/home/VideoInputForm';
import { useVideoInput } from '../../features/home/useVideoInput';
import { usePlayerStore } from '../../store/usePlayerStore';

function HomePage() {
  const navigate = useNavigate();
  const setSelectedMode = usePlayerStore((state) => state.setSelectedMode);
  const setSessionId = usePlayerStore((state) => state.setSessionId);
  const { values, isModeSelectVisible, updateField, handleSubmit } = useVideoInput();

  const handleModeSelect = (mode: 'spinner' | 'rain') => {
    setSelectedMode(mode);
    setSessionId(`mock-session-${mode}`);
    navigate(mode === 'spinner' ? ROUTES.PLAYER_SPINNER : ROUTES.PLAYER_RAIN);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Study Entry"
        title="Set up your listening practice"
        description="Collect a video or audio source first, then move into the learning mode you want to prototype."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <VideoInputForm
          values={values}
          onYoutubeUrlChange={(value) => updateField('youtubeUrl', value)}
          onAudioFileChange={(file) => updateField('audioFile', file)}
          onPersonalVideoLinkChange={(value) => updateField('personalVideoLink', value)}
          onSubmit={handleSubmit}
        />

        <div className="space-y-6">
          {isModeSelectVisible ? (
            <ModeSelect onSelect={handleModeSelect} />
          ) : (
            <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 py-8 text-slate-500">
              Submit one of the input sources to unlock the mode selection skeleton.
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
