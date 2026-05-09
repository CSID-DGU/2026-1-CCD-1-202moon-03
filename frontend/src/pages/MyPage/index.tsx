import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useMyPage } from '../../features/mypage/useMyPage';
import type { LearningHistoryItem } from '../../types';

function formatJoinedDate(value?: string) {
  if (!value) {
    return '가입일 정보를 불러오는 중';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')} 가입`;
}

function formatCompletedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatStudyTime(totalStudySeconds: number) {
  if (totalStudySeconds <= 0) {
    return '집계 중';
  }

  const hours = Math.floor(totalStudySeconds / 3600);
  const minutes = Math.round((totalStudySeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  return `${minutes}분`;
}

function formatWatchRate(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getAvatarLabel(avatarType?: string) {
  switch (avatarType) {
    case 'character_2':
      return 'B';
    case 'character_3':
      return 'C';
    case 'character_4':
      return 'D';
    default:
      return 'A';
  }
}

function getAvatarColor(avatarType?: string) {
  switch (avatarType) {
    case 'character_2':
      return 'from-[#FFD9A8] to-[#F79B72]';
    case 'character_3':
      return 'from-[#C9F2C7] to-[#56C98E]';
    case 'character_4':
      return 'from-[#D3DAFF] to-[#7A8CFF]';
    default:
      return 'from-[#B7E5FF] to-[#1A9AF5]';
  }
}

function getDisplayKey(settingKey?: string | null) {
  switch (settingKey) {
    case 'ctrl':
      return 'A';
    case 'shift':
      return 'B';
    case 'alt':
    default:
      return 'D';
  }
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#E7EDF5] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-5">
        <div className="space-y-1">
          <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#15171C]">{title}</h2>
          {description ? <p className="text-sm leading-6 text-[#697180]">{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function GhostButton({
  children,
  tone = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'danger' }) {
  const className =
    tone === 'danger'
      ? 'border-[#FFD2D8] bg-[#FFF5F7] text-[#D62B45] hover:bg-[#FFE8EC]'
      : 'border-[#CFE5F8] bg-[#F8FBFF] text-[#1A6FB3] hover:bg-[#EEF7FF]';

  return (
    <button
      {...props}
      className={`inline-flex h-12 items-center justify-center rounded-[16px] border px-5 text-sm font-semibold transition-colors ${className} ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 items-center justify-center rounded-[16px] bg-[#1A9AF5] px-5 text-sm font-semibold text-white shadow-[inset_0px_4px_4px_rgba(81,183,255,0.45),inset_0px_-4px_4px_rgba(6,132,222,0.35)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[#EEF2F7] bg-[#FCFDFE] px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-[#697180]">{label}</p>
        <p className="text-base font-semibold text-[#15171C]">{value}</p>
      </div>
      {action}
    </div>
  );
}

function HistoryItemCard({ item }: { item: LearningHistoryItem }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-[#EEF2F7] bg-white px-4 py-4">
      <div className="flex h-14 w-14 flex-none items-center justify-center rounded-[18px] bg-[#F0F7FF] text-sm font-bold uppercase text-[#1A9AF5]">
        {item.mode === 'rain' ? 'RAIN' : 'SPIN'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-[#15171C]">{item.title}</p>
        <p className="mt-1 text-sm text-[#697180]">
          {formatCompletedDate(item.completed_at)} · 시청률 {formatWatchRate(item.watch_rate)}
        </p>
      </div>
      <div className="text-right text-sm text-[#697180]">
        <p>
          퀴즈 {item.quiz_correct}/{item.quiz_total}
        </p>
        {typeof item.total_score === 'number' ? <p>점수 {item.total_score}</p> : null}
      </div>
    </div>
  );
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-5 py-10">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[560px] rounded-[28px] bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-[#15171C]">{title}</h3>
            {description ? <p className="text-sm leading-6 text-[#697180]">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#697180] transition-colors hover:bg-[#F2F5F8]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MyPage() {
  const {
    avatarOptions,
    fidgetKeyOptions,
    authUser,
    profile,
    settings,
    history,
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

  const displayName = profile?.nickname || authUser?.nickname || authUser?.username || '사용자';
  const username = profile?.username || authUser?.username || '';
  const createdAt = profile?.created_at || authUser?.createdAt;
  const email = profile?.email || authUser?.email || '이메일 정보 없음';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="MYPAGE"
        title="마이페이지"
        description="프로필, 학습 통계, 보안 설정과 회원탈퇴까지 한 곳에서 관리할 수 있어요."
      />

      {pageError ? (
        <div className="rounded-[20px] border border-[#FFD6DC] bg-[#FFF5F7] px-5 py-4 text-sm text-[#C7254E]">
          {pageError}
        </div>
      ) : null}

      {notice && dialog === null ? (
        <div className="rounded-[20px] border border-[#D6ECFF] bg-[#F5FBFF] px-5 py-4 text-sm text-[#1A6FB3]">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SectionCard title="프로필" description="캐릭터와 기본 정보를 확인하고 수정할 수 있어요.">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-[32px] bg-gradient-to-br ${getAvatarColor(
                profile?.avatar_type || authUser?.avatarType,
              )} text-[40px] font-bold text-white shadow-[0_18px_40px_rgba(26,154,245,0.24)]`}
            >
              {getAvatarLabel(profile?.avatar_type || authUser?.avatarType)}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-[28px] font-semibold tracking-[-0.04em] text-[#15171C]">
                  {displayName}
                  {username ? (
                    <span className="ml-2 text-[18px] font-medium text-[#697180]">({username})</span>
                  ) : null}
                </h2>
                <p className="mt-2 text-sm text-[#697180]">{formatJoinedDate(createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <GhostButton onClick={() => openDialog('profile')}>편집</GhostButton>
                <GhostButton onClick={() => openDialog('settings')}>환경설정</GhostButton>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-[#F6FAFE] px-5 py-5">
              <p className="text-sm font-medium text-[#697180]">총 학습 시간</p>
              <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#15171C]">
                {formatStudyTime(stats.totalStudySeconds)}
              </p>
            </div>
            <div className="rounded-[24px] bg-[#F9F7FF] px-5 py-5">
              <p className="text-sm font-medium text-[#697180]">완료한 영상 수</p>
              <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#15171C]">
                {stats.completedVideoCount}개
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="보안 설정" description="비밀번호 변경과 탈퇴는 본인 확인 후 바로 처리됩니다.">
          <div className="space-y-4">
            <InfoRow
              label="비밀번호"
              value="현재 비밀번호를 확인한 뒤 새 비밀번호로 변경할 수 있어요."
              action={<GhostButton onClick={() => openDialog('password')}>비밀번호 변경</GhostButton>}
            />
            <InfoRow
              label="회원탈퇴"
              value="탈퇴 후 아이디는 복구할 수 없으며 관련 법령에 따라 정보가 보관 후 삭제됩니다."
              action={
                <GhostButton tone="danger" onClick={() => openDialog('delete')}>
                  회원탈퇴
                </GhostButton>
              }
            />
            <GhostButton className="w-full" onClick={() => void logoutToOnboarding()}>
              로그아웃
            </GhostButton>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard
          title="환경설정"
          description="키캡 모드에서 사용할 키를 바꿀 수 있어요. 기본값은 D키예요."
        >
          <InfoRow
            label="현재 설정된 키"
            value={`${getDisplayKey(settings?.fidget_toggle_key || pendingKeySelection || 'alt')}키`}
            action={<GhostButton onClick={() => openDialog('settings')}>변경</GhostButton>}
          />
          <div className="rounded-[20px] border border-dashed border-[#D7E4F3] bg-[#FBFDFF] px-4 py-4 text-sm text-[#697180]">
            키 변경 버튼을 누르면 입력 대기 상태로 바뀌고, D / A / B 중 하나를 눌러 저장할 수 있어요.
          </div>
        </SectionCard>

        <SectionCard
          title="최근 학습 기록"
          description="완료된 학습 세션을 최근 순서대로 확인할 수 있어요."
        >
          {isLoading ? <p className="text-sm text-[#697180]">학습 기록을 불러오는 중입니다.</p> : null}

          {!isLoading && history.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#D7E4F3] bg-[#FBFDFF] px-4 py-6 text-sm text-[#697180]">
              아직 완료된 학습 기록이 없어요.
            </div>
          ) : null}

          <div className="space-y-3">
            {history.slice(0, 4).map((item) => (
              <HistoryItemCard key={item.session_id} item={item} />
            ))}
          </div>

          {history.length > 0 ? (
            <div className="grid gap-3 rounded-[20px] border border-[#EEF2F7] bg-[#FCFDFE] px-5 py-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-[#697180]">평균 시청률</p>
                <p className="mt-1 text-xl font-semibold text-[#15171C]">
                  {formatWatchRate(stats.averageWatchRate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#697180]">등록 이메일</p>
                <p className="mt-1 truncate text-base font-semibold text-[#15171C]">{email}</p>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      {dialog === 'profile' ? (
        <ModalShell
          title="개인정보 수정"
          description="현재 API 기준으로 캐릭터와 이름을 수정할 수 있어요. 이메일은 로그인 ID라 수정되지 않습니다."
          onClose={closeDialog}
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#697180]">캐릭터 선택</p>
              <div className="grid grid-cols-4 gap-3">
                {avatarOptions.map((avatar) => {
                  const isActive = profileForm.avatar_type === avatar;
                  return (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setProfileForm((current) => ({ ...current, avatar_type: avatar }))}
                      className={`flex h-20 items-center justify-center rounded-[24px] bg-gradient-to-br text-2xl font-bold text-white transition-transform hover:-translate-y-0.5 ${getAvatarColor(
                        avatar,
                      )} ${isActive ? 'ring-4 ring-[#BFE1FF]' : ''}`}
                    >
                      {getAvatarLabel(avatar)}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField label="이름">
              <input
                value={profileForm.nickname ?? ''}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, nickname: event.target.value }))
                }
                placeholder="이름을 입력해주세요"
                className="h-12 w-full rounded-[16px] border border-[#D7E4F3] px-4 text-base outline-none transition-colors focus:border-[#1A9AF5]"
              />
            </FormField>

            <FormField label="이메일">
              <input
                value={email}
                readOnly
                className="h-12 w-full rounded-[16px] border border-[#E8EDF3] bg-[#F7F9FC] px-4 text-base text-[#697180] outline-none"
              />
            </FormField>

            <FormField label="아이디">
              <input
                value={username}
                readOnly
                className="h-12 w-full rounded-[16px] border border-[#E8EDF3] bg-[#F7F9FC] px-4 text-base text-[#697180] outline-none"
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="생년월일">
                <input
                  value="현재 API 미지원"
                  readOnly
                  className="h-12 w-full rounded-[16px] border border-[#E8EDF3] bg-[#F7F9FC] px-4 text-base text-[#9AA3AF] outline-none"
                />
              </FormField>
              <FormField label="성별">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled
                    className="h-12 rounded-[16px] border border-[#E8EDF3] bg-[#F7F9FC] text-sm font-medium text-[#9AA3AF]"
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    disabled
                    className="h-12 rounded-[16px] border border-[#E8EDF3] bg-[#F7F9FC] text-sm font-medium text-[#9AA3AF]"
                  >
                    여성
                  </button>
                </div>
              </FormField>
            </div>

            {notice ? <NoticeText>{notice}</NoticeText> : null}

            <div className="flex justify-end gap-3">
              <GhostButton onClick={closeDialog}>취소</GhostButton>
              <PrimaryButton disabled={isSavingProfile} onClick={() => void saveProfile()}>
                {isSavingProfile ? '저장 중...' : '개인정보 수정'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'password' ? (
        <ModalShell
          title="비밀번호 변경"
          description="영문 대소문자, 숫자, 특수문자를 포함한 8자 이상 비밀번호를 권장해요."
          onClose={closeDialog}
        >
          <div className="space-y-5">
            <FormField label="현재 비밀번호">
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    current_password: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-[16px] border border-[#D7E4F3] px-4 text-base outline-none transition-colors focus:border-[#1A9AF5]"
              />
            </FormField>
            <FormField label="새 비밀번호">
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    new_password: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-[16px] border border-[#D7E4F3] px-4 text-base outline-none transition-colors focus:border-[#1A9AF5]"
              />
            </FormField>
            <FormField label="새 비밀번호 확인">
              <input
                type="password"
                value={passwordForm.new_password_confirm}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    new_password_confirm: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-[16px] border border-[#D7E4F3] px-4 text-base outline-none transition-colors focus:border-[#1A9AF5]"
              />
            </FormField>

            {notice ? <NoticeText>{notice}</NoticeText> : null}

            <div className="flex justify-end gap-3">
              <GhostButton onClick={closeDialog}>취소</GhostButton>
              <PrimaryButton disabled={isSavingPassword} onClick={() => void savePassword()}>
                {isSavingPassword ? '변경 중...' : '비밀번호 변경'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'passwordSuccess' ? (
        <ModalShell
          title="비밀번호 변경 완료"
          description="보안을 위해 다시 로그인해주세요."
          onClose={() => void confirmPasswordChange()}
        >
          <div className="space-y-5">
            <NoticeText>비밀번호 변경이 완료되었습니다.</NoticeText>
            <div className="flex justify-end">
              <PrimaryButton onClick={() => void confirmPasswordChange()}>로그인</PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'settings' ? (
        <ModalShell
          title="환경설정"
          description="변경 버튼을 누른 뒤 D, A, B 키를 눌러도 되고, 아래 옵션을 바로 선택해도 됩니다."
          onClose={closeDialog}
        >
          <div className="space-y-5">
            <FormField label="현재 선택된 키">
              <div className="flex h-12 items-center rounded-[16px] border border-[#D7E4F3] bg-[#FBFDFF] px-4 text-base font-semibold text-[#15171C]">
                {getDisplayKey(pendingKeySelection || settings?.fidget_toggle_key || 'alt')}키
              </div>
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              {fidgetKeyOptions.map((option) => {
                const isActive = (pendingKeySelection || settings?.fidget_toggle_key) === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPendingKeySelection(option)}
                    className={`h-12 rounded-[16px] border text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-[#1A9AF5] bg-[#EAF6FF] text-[#1A6FB3]'
                        : 'border-[#D7E4F3] bg-white text-[#697180] hover:bg-[#F8FBFF]'
                    }`}
                  >
                    {getDisplayKey(option)}키
                  </button>
                );
              })}
            </div>

            <div className="rounded-[18px] bg-[#F7FAFE] px-4 py-4 text-sm leading-6 text-[#697180]">
              현재 화면에서는 D, A, B 키로 보여주고 저장되도록 맞췄습니다.
            </div>

            {notice ? <NoticeText>{notice}</NoticeText> : null}

            <div className="flex justify-end gap-3">
              <GhostButton onClick={closeDialog}>취소</GhostButton>
              <PrimaryButton disabled={isSavingSettings} onClick={() => void saveSettings()}>
                {isSavingSettings ? '저장 중...' : '환경설정 저장'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'delete' ? (
        <ModalShell
          title="회원탈퇴"
          description={`${displayName}님 정말 회원탈퇴하시겠어요? 탈퇴 후 아이디는 복구할 수 없어요.`}
          onClose={closeDialog}
        >
          <div className="space-y-5">
            <FormField label="비밀번호 확인">
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="회원탈퇴를 위해 비밀번호를 입력해주세요"
                className="h-12 w-full rounded-[16px] border border-[#D7E4F3] px-4 text-base outline-none transition-colors focus:border-[#1A9AF5]"
              />
            </FormField>

            <div className="rounded-[18px] bg-[#FFF6F7] px-4 py-4 text-sm leading-6 text-[#C7254E]">
              회원 탈퇴 시 개인정보는 관련 법령에 따라 일정 기간 보관 후 삭제되며, 탈퇴 즉시 서비스를 다시 이용하려면 새 계정이 필요합니다.
            </div>

            {notice ? <NoticeText tone="danger">{notice}</NoticeText> : null}

            <div className="flex justify-end gap-3">
              <GhostButton onClick={closeDialog}>취소</GhostButton>
              <PrimaryButton
                disabled={isDeletingAccount}
                onClick={() => void removeAccount()}
                className="bg-[#F04452] shadow-none hover:opacity-90"
              >
                {isDeletingAccount ? '탈퇴 처리 중...' : '회원탈퇴'}
              </PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {dialog === 'deleteSuccess' ? (
        <ModalShell
          title="회원탈퇴 완료"
          description="이용해주셔서 감사합니다."
          onClose={() => void confirmDeleteAccount()}
        >
          <div className="space-y-5">
            <NoticeText>회원탈퇴가 완료되었습니다.</NoticeText>
            <div className="flex justify-end">
              <PrimaryButton onClick={() => void confirmDeleteAccount()}>확인</PrimaryButton>
            </div>
          </div>
        </ModalShell>
      ) : null}
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
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#697180]">{label}</span>
      {children}
    </label>
  );
}

function NoticeText({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'danger';
}) {
  return (
    <div
      className={`rounded-[16px] px-4 py-3 text-sm ${
        tone === 'danger'
          ? 'bg-[#FFF5F7] text-[#C7254E]'
          : 'bg-[#F5FBFF] text-[#1A6FB3]'
      }`}
    >
      {children}
    </div>
  );
}

export default MyPage;
