import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import character01_1 from '../../assets/user/character01_1.png';
import character01_2 from '../../assets/user/character01_2.png';
import character01_3 from '../../assets/user/character01_3.png';
import character02_1 from '../../assets/user/character02_1.png';
import character02_2 from '../../assets/user/character02_2.png';
import character02_3 from '../../assets/user/character02_3.png';
import character03_1 from '../../assets/user/character03_1.png';
import character03_2 from '../../assets/user/character03_2.png';
import character03_3 from '../../assets/user/character03_3.png';
import character04_1 from '../../assets/user/character04_1.png';
import character04_2 from '../../assets/user/character04_2.png';
import character04_3 from '../../assets/user/character04_3.png';
import character05_1 from '../../assets/user/character05_1.png';
import character05_2 from '../../assets/user/character05_2.png';
import character05_3 from '../../assets/user/character05_3.png';
import character06_1 from '../../assets/user/character06_1.png';
import character06_2 from '../../assets/user/character06_2.png';
import character06_3 from '../../assets/user/character06_3.png';
import character07_1 from '../../assets/user/character07_1.png';
import character07_2 from '../../assets/user/character07_2.png';
import character07_3 from '../../assets/user/character07_3.png';
import character08_1 from '../../assets/user/character08_1.png';
import character08_2 from '../../assets/user/character08_2.png';
import character08_3 from '../../assets/user/character08_3.png';
import { LearningDashboardPanel } from '../../features/mypage/LearningDashboardPanel';
import { useMyPage } from '../../features/mypage/useMyPage';

type AvatarKey =
  | 'character01'
  | 'character02'
  | 'character03'
  | 'character04'
  | 'character05'
  | 'character06'
  | 'character07'
  | 'character08';

const AVATAR_GROUPS: { key: AvatarKey; images: [string, string, string] }[] = [
  { key: 'character01', images: [character01_1, character01_2, character01_3] },
  { key: 'character02', images: [character02_1, character02_2, character02_3] },
  { key: 'character03', images: [character03_1, character03_2, character03_3] },
  { key: 'character04', images: [character04_1, character04_2, character04_3] },
  { key: 'character05', images: [character05_1, character05_2, character05_3] },
  { key: 'character06', images: [character06_1, character06_2, character06_3] },
  { key: 'character07', images: [character07_1, character07_2, character07_3] },
  { key: 'character08', images: [character08_1, character08_2, character08_3] },
];

const AVATAR_BACKGROUND_COLORS: Record<AvatarKey, string> = {
  character01: '#FFF4CD',
  character02: '#D2F2EA',
  character03: '#F1E0F9',
  character04: '#FFDDE7',
  character05: '#C8DFFF',
  character06: '#F1ECC8',
  character07: '#FDE6D6',
  character08: '#DDE4FF',
};

function normalizeAvatarKey(value?: string | null): AvatarKey {
  switch (value) {
    case 'character_1':
    case 'character01':
      return 'character01';
    case 'character_2':
    case 'character02':
      return 'character02';
    case 'character_3':
    case 'character03':
      return 'character03';
    case 'character_4':
    case 'character04':
      return 'character04';
    case 'character_5':
    case 'character05':
      return 'character05';
    case 'character_6':
    case 'character06':
      return 'character06';
    case 'character_7':
    case 'character07':
      return 'character07';
    case 'character_8':
    case 'character08':
      return 'character08';
    default:
      return 'character01';
  }
}

function getAvatarGroup(value?: string | null) {
  const key = normalizeAvatarKey(value);
  return AVATAR_GROUPS.find((group) => group.key === key) ?? AVATAR_GROUPS[0];
}

function formatJoinedDate(value?: string) {
  if (!value) {
    return '가입일 정보 없음';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function formatStudyTime(totalStudySeconds: number) {
  if (totalStudySeconds <= 0) {
    return '0분';
  }

  const hours = Math.floor(totalStudySeconds / 3600);
  const minutes = Math.round((totalStudySeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }

  return `${minutes}분`;
}

function getDisplayKey(settingKey?: string | null) {
  switch (settingKey) {
    case 'ctrl':
      return 'Enter';
    case 'shift':
      return 'Shift';
    default:
      return 'Enter';
  }
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4.2 13.9 3.5 16.5l2.6-.7L14.8 7a1.8 1.8 0 0 0 0-2.5l-.3-.3a1.8 1.8 0 0 0-2.5 0L4.2 13.9Z" />
      <path d="m10.8 5.4 3.8 3.8" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-[#15171C]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AvatarPreview({
  avatarType,
  size = 128,
  editable = false,
  onClick,
}: {
  avatarType?: string | null;
  size?: number;
  editable?: boolean;
  onClick?: () => void;
}) {
  const avatarGroup = getAvatarGroup(avatarType);
  const imageSrc = avatarGroup.images[0];
  const backgroundColor = AVATAR_BACKGROUND_COLORS[avatarGroup.key];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="relative shrink-0 disabled:cursor-default"
      style={{ width: size, height: size }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-full"
        style={{ backgroundColor }}
      >
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-[102%] w-auto max-w-none -translate-x-1/2 object-contain"
        />
      </div>
      {editable ? (
        <div className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#1A9AF5] text-white shadow-[0_6px_16px_rgba(26,154,245,0.28)]">
          <PencilIcon />
        </div>
      ) : null}
    </button>
  );
}

function SideMenuItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-[10px] px-4 py-3 text-left text-[18px] leading-[1.5] tracking-[-0.025em] transition-colors ${
        active ? 'font-semibold text-[#15171C]' : 'font-medium text-[#9499A3] hover:text-[#15171C]'
      }`}
    >
      {children}
    </button>
  );
}

function OutlineButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[10px] border border-[#D9DEE8] bg-white px-4 text-[15px] font-medium text-[#15171C] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-14 items-center justify-center rounded-[16px] border border-[#1A9AF5] bg-[#1A9AF5] px-7 text-[16px] font-bold tracking-[-0.025em] text-white shadow-[inset_0_4px_4px_rgba(81,183,255,0.45),inset_0_-4px_4px_rgba(6,132,222,0.35)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[28px] font-bold leading-[1.25] tracking-[-0.03em] text-[#15171C]">
      {children}
    </h2>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-h-[132px] min-w-0 flex-1 flex-col rounded-[10px] border border-[#E5E7EC] bg-white px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex items-start justify-between gap-4">
        <span className="whitespace-nowrap text-[16px] font-medium tracking-[-0.02em] text-[#15171C]">
          {label}
        </span>
        <div className="mt-1 shrink-0">{icon}</div>
      </div>
      <strong className="mt-4 break-keep text-[40px] font-bold leading-none tracking-[-0.04em] text-[#15171C] sm:text-[44px]">
        {value}
      </strong>
    </div>
  );
}

function ActionRow({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[76px] w-full items-center justify-between rounded-[10px] border border-[#E5E7EC] bg-white px-7 text-left transition-colors hover:bg-[#FBFCFE]"
    >
      <span className={`text-[16px] font-medium tracking-[-0.02em] ${danger ? 'text-[#E5484D]' : 'text-[#15171C]'}`}>
        {label}
      </span>
      <ChevronRightIcon />
    </button>
  );
}

function ToastNotice({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-[70] flex w-full max-w-[420px] -translate-x-1/2 items-center gap-3 rounded-[12px] bg-[#3A3D45] px-4 py-4 text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-white">
        <CheckIcon />
      </div>
      <p className="text-[16px] font-medium leading-[1.45] tracking-[-0.02em] text-white">{children}</p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  widthClassName = 'max-w-[420px]',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(21,23,28,0.32)] px-6 py-8">
      <div className={`w-full rounded-[28px] bg-white shadow-[0_30px_90px_rgba(16,24,40,0.18)] ${widthClassName}`}>
        <div className="flex items-center justify-between px-8 pb-4 pt-8">
          <h3 className="text-[20px] font-bold tracking-[-0.03em] text-[#15171C]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#15171C] transition-opacity hover:opacity-70">
            <CloseIcon />
          </button>
        </div>
        <div className="px-8 pb-8">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[16px] font-medium tracking-[-0.02em] text-[#15171C]">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-[56px] rounded-[12px] border border-[#CBD4E1] bg-white px-4 text-[16px] font-medium tracking-[-0.02em] text-[#15171C] outline-none transition-colors placeholder:text-[#B6BDC8] focus:border-[#1A9AF5] ${props.className ?? ''}`}
    />
  );
}

function DisabledField({ value }: { value?: string }) {
  return (
    <div className="flex h-[56px] items-center rounded-[12px] border border-[#CBD4E1] bg-[#F6F8FB] px-4 text-[16px] font-medium tracking-[-0.02em] text-[#B6BDC8]">
      {value || '-'}
    </div>
  );
}

function NoticeText({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <p className={`text-[14px] leading-[1.5] ${danger ? 'text-[#E5484D]' : 'text-[#6B7280]'}`}>
      {children}
    </p>
  );
}

function SuccessContent({
  message,
  buttonLabel,
  onConfirm,
}: {
  message: string;
  buttonLabel: string;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-7 px-2 pb-1 pt-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E9F8EF] text-[#22C55E]">
        <CheckIcon />
      </div>
      <p className="text-[18px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#15171C]">{message}</p>
      <PrimaryButton onClick={onConfirm} className="w-full">
        {buttonLabel}
      </PrimaryButton>
    </div>
  );
}

export default function MyPage() {
  const {
    dashboard,
    profile,
    settings,
    stats,
    isLoading,
    pageError,
    notice,
    dialog,
    profileForm,
    passwordForm,
    deletePassword,
    pendingKeySelection,
    isSavingProfile,
    isSavingPassword,
    isSavingSettings,
    isDeletingAccount,
    setProfileForm,
    setPasswordForm,
    setDeletePassword,
    setPendingKeySelection,
    openDialog,
    closeDialog,
    saveProfile,
    savePassword,
    saveSettings,
    removeAccount,
    confirmPasswordChange,
    confirmDeleteAccount,
    logoutToOnboarding,
  } = useMyPage();

  const isDashboardView = dialog === 'dashboard';
  const isSettingsView = dialog === 'settings';
  const activeAvatarGroup = getAvatarGroup(profileForm.avatar_type ?? profile?.avatar_type);

  return (
    <div className="min-h-screen bg-white text-[#15171C]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 lg:flex-row lg:gap-0 lg:px-8 lg:pt-10">
        <aside className="w-full shrink-0 border-b border-[#E5E7EC] pb-4 lg:w-[220px] lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8 lg:pt-10">
          <nav className="flex flex-col gap-1">
            <SideMenuItem active={!isDashboardView && !isSettingsView} onClick={() => closeDialog()}>
              프로필
            </SideMenuItem>
            <SideMenuItem active={isDashboardView} onClick={() => openDialog('dashboard')}>
              학습 대시보드
            </SideMenuItem>
            <SideMenuItem active={isSettingsView} onClick={() => openDialog('settings')}>
              설정
            </SideMenuItem>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pt-2 lg:pl-10 lg:pt-6">
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center text-[18px] text-[#6B7280]">
              불러오는 중...
            </div>
          ) : pageError ? (
            <div className="rounded-[16px] border border-[#F3C1C4] bg-[#FFF5F5] px-6 py-5 text-[16px] text-[#B42318]">
              {pageError}
            </div>
          ) : isDashboardView ? (
            <section className="max-w-[940px]">
              <LearningDashboardPanel dashboard={dashboard} formatDisplayedStudyTime={formatStudyTime} />
            </section>
          ) : isSettingsView ? (
            <section className="max-w-[720px]">
              <SectionTitle>설정</SectionTitle>
              <div className="mt-12 rounded-[16px] border border-[#E5E7EC] bg-white px-8 py-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-[-0.025em] text-[#15171C]">
                      피젯 모드 키
                    </h3>
                    <p className="mt-2 text-[15px] leading-[1.6] text-[#6B7280]">
                      현재 선택된 키: {getDisplayKey(settings?.fidget_toggle_key)}
                    </p>
                  </div>
                  <p className="max-w-[280px] text-right text-[14px] leading-[1.6] text-[#6B7280]">
                    Enter, Shift 중 하나를 선택하세요.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  {['ctrl', 'shift'].map((key) => {
                    const label = getDisplayKey(key);
                    const selected = (pendingKeySelection ?? settings?.fidget_toggle_key) === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPendingKeySelection(key)}
                        className={`flex h-[56px] min-w-[96px] items-center justify-center rounded-[12px] border text-[18px] font-semibold transition-colors ${
                          selected
                            ? 'border-[#1A9AF5] bg-[#E8F4FE] text-[#1A9AF5]'
                            : 'border-[#D7DDE7] bg-white text-[#9499A3] hover:border-[#AEB7C5] hover:text-[#15171C]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {notice ? <p className="mt-4 text-[14px] text-[#6B7280]">{notice}</p> : null}

                <div className="mt-8 flex justify-end">
                  <PrimaryButton onClick={() => void saveSettings()} disabled={isSavingSettings} className="min-w-[120px]">
                    {isSavingSettings ? '저장 중...' : '저장'}
                  </PrimaryButton>
                </div>
              </div>
            </section>
          ) : (
            <section className="max-w-[940px]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                  <AvatarPreview avatarType={profile?.avatar_type} size={132} editable onClick={() => openDialog('avatar')} />
                  <div className="pt-1">
                    <h1 className="text-[28px] font-bold leading-[1.25] tracking-[-0.03em] text-[#15171C]">
                      {profile?.nickname || '사용자'}
                    </h1>
                    <p className="mt-3 text-[18px] tracking-[-0.025em] text-[#15171C]">
                      가입일: {formatJoinedDate(profile?.created_at)}
                    </p>
                  </div>
                </div>

                <OutlineButton onClick={() => openDialog('profile')}>프로필 수정</OutlineButton>
              </div>

              <div className="mt-16">
                <SectionTitle>비밀번호 변경</SectionTitle>
                <div className="mt-7">
                  <ActionRow label="비밀번호 변경" onClick={() => openDialog('password')} />
                </div>
              </div>

              <div className="mt-16">
                <SectionTitle>회원 탈퇴</SectionTitle>
                <div className="mt-7">
                  <ActionRow label="회원 탈퇴" onClick={() => openDialog('delete')} danger />
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void logoutToOnboarding()}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] px-4 text-[16px] font-medium text-[#6B7280] transition-colors hover:bg-[#F6F8FB] hover:text-[#15171C]"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {dialog === 'profile' ? (
        <ModalShell title="프로필 수정" onClose={closeDialog}>
          <div className="flex flex-col gap-6">
            <FormField label="이름">
              <TextInput
                value={profileForm.nickname ?? ''}
                onChange={(event) => setProfileForm((current) => ({ ...current, nickname: event.target.value }))}
              />
            </FormField>

            <FormField label="생년월일">
              <TextInput
                value={profileForm.birth_date ?? ''}
                placeholder="2000/10/10"
                onChange={(event) => setProfileForm((current) => ({ ...current, birth_date: event.target.value }))}
              />
            </FormField>

            <FormField label="이메일">
              <DisabledField value={profile?.email} />
            </FormField>

            <FormField label="성별">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'male', label: '남성' },
                  { value: 'female', label: '여성' },
                ].map((option) => {
                  const selected = profileForm.gender === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          gender: option.value as 'male' | 'female',
                        }))
                      }
                      className={`flex h-[48px] items-center justify-center rounded-[12px] border text-[16px] font-semibold transition-colors ${
                        selected
                          ? 'border-[#1A9AF5] bg-[#E8F4FE] text-[#1A9AF5]'
                          : 'border-[#D7DDE7] bg-white text-[#9499A3] hover:border-[#AEB7C5] hover:text-[#15171C]'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {notice ? <NoticeText danger>{notice}</NoticeText> : null}

            <div className="flex justify-end pt-2">
              <PrimaryButton onClick={() => void saveProfile()} disabled={isSavingProfile} className="min-w-[120px]">
                {isSavingProfile ? '저장 중...' : '저장'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'avatar' ? (
        <ModalShell title="아바타 변경" onClose={closeDialog} widthClassName="max-w-[760px]">
          <div className="flex flex-col">
            <div className="flex justify-center pb-8 pt-2">
              <AvatarPreview avatarType={activeAvatarGroup.key} size={200} />
            </div>

            <div className="grid max-h-[630px] grid-cols-2 gap-x-6 gap-y-7 overflow-y-auto px-2 py-2 sm:grid-cols-4">
              {AVATAR_GROUPS.map((group) => {
                const selected = normalizeAvatarKey(profileForm.avatar_type) === group.key;
                const backgroundColor = AVATAR_BACKGROUND_COLORS[group.key];
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setProfileForm((current) => ({ ...current, avatar_type: group.key }))}
                    className={`flex items-center justify-center rounded-full p-[6px] transition-all ${
                      selected
                        ? 'bg-[#EAF5FF] ring-2 ring-inset ring-[#1A9AF5]'
                        : 'bg-transparent hover:bg-[#F5F9FF]'
                    }`}
                  >
                    <div
                      className="relative aspect-square w-full overflow-hidden rounded-full"
                      style={{ backgroundColor }}
                    >
                      <img
                        src={group.images[0]}
                        alt=""
                        aria-hidden="true"
                        className="absolute bottom-0 left-1/2 h-[102%] w-auto max-w-none -translate-x-1/2 object-contain"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {notice ? <p className="mt-4 text-[14px] text-[#E5484D]">{notice}</p> : null}

            <div className="mt-8 flex justify-end">
              <PrimaryButton onClick={() => void saveProfile()} disabled={isSavingProfile} className="min-w-[120px]">
                {isSavingProfile ? '저장 중...' : '저장'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'password' ? (
        <ModalShell title="비밀번호 변경" onClose={closeDialog}>
          <div className="flex flex-col gap-6">
            <FormField label="현재 비밀번호">
              <TextInput
                type="password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                }
              />
            </FormField>
            <FormField label="새 비밀번호">
              <TextInput
                type="password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, new_password: event.target.value }))
                }
              />
            </FormField>
            <FormField label="새 비밀번호 확인">
              <TextInput
                type="password"
                value={passwordForm.new_password_confirm}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, new_password_confirm: event.target.value }))
                }
              />
            </FormField>
            {notice ? <NoticeText danger>{notice}</NoticeText> : null}
            <div className="flex justify-end pt-2">
              <PrimaryButton onClick={() => void savePassword()} disabled={isSavingPassword} className="min-w-[120px]">
                {isSavingPassword ? '저장 중...' : '저장'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'delete' ? (
        <ModalShell title="회원 탈퇴" onClose={closeDialog}>
          <div className="flex flex-col gap-6">
            <p className="text-[15px] leading-[1.6] text-[#6B7280]">
              회원 탈퇴 시 학습 기록과 프로필 정보가 삭제됩니다.
              계속하려면 비밀번호를 입력하세요.
            </p>
            <FormField label="비밀번호">
              <TextInput type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
            </FormField>
            {notice ? <NoticeText danger>{notice}</NoticeText> : null}
            <div className="flex justify-end pt-2">
              <PrimaryButton onClick={() => void removeAccount()} disabled={isDeletingAccount} className="min-w-[120px]">
                {isDeletingAccount ? '탈퇴 처리 중...' : '회원 탈퇴'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'passwordSuccess' ? (
        <ModalShell title="비밀번호 변경 완료" onClose={confirmPasswordChange}>
          <SuccessContent
            message="비밀번호가 변경되었습니다. 다시 로그인해 주세요."
            buttonLabel="확인"
            onConfirm={() => void confirmPasswordChange()}
          />
        </ModalShell>
      ) : null}

      {dialog === 'deleteSuccess' ? (
        <ModalShell title="회원 탈퇴 완료" onClose={confirmDeleteAccount}>
          <SuccessContent
            message="회원 탈퇴가 완료되었습니다."
            buttonLabel="확인"
            onConfirm={() => void confirmDeleteAccount()}
          />
        </ModalShell>
      ) : null}

      {notice && dialog === null ? <ToastNotice>{notice}</ToastNotice> : null}
    </div>
  );
}
