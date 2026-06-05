import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { getLearningDashboard } from '../../services/analytic.api';
import {
  changeMyPassword,
  deleteMyAccount,
  getMyProfile,
  getMySettings,
  updateMyProfile,
  updateMySettings,
} from '../../services/user.api';
import { useAuthStore } from '../../store/useAuthStore';
import type {
  ApiErrorResponse,
  ChangeMyPasswordRequest,
  LearningDashboardData,
  UpdateMyProfileRequest,
  UserProfileData,
  UserSettingsData,
} from '../../types';

const AVATAR_OPTIONS = [
  'character01',
  'character02',
  'character03',
  'character04',
  'character05',
  'character06',
  'character07',
  'character08',
] as const;
const FIDGET_KEY_OPTIONS = ['ctrl', 'shift'] as const;

type MyPageDialog =
  | 'profile'
  | 'avatar'
  | 'password'
  | 'settings'
  | 'delete'
  | 'passwordSuccess'
  | 'deleteSuccess'
  | null;

interface LearningStats {
  completedVideoCount: number;
  totalStudySeconds: number;
  averageWatchRate: number;
}

function extractErrorMessage(error: unknown, fallbackMessage: string) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.response?.data?.detail || fallbackMessage;
  }

  return fallbackMessage;
}

function mapProfileToAuthUser(profile: UserProfileData) {
  return {
    id: String(profile.user_id),
    username: profile.username,
    nickname: profile.nickname,
    name: profile.nickname || profile.username,
    email: profile.email,
    avatarType: profile.avatar_type,
    stimulationLevel: profile.stimulation_level,
    isTutorialDone: profile.is_tutorial_done,
    createdAt: profile.created_at,
  };
}

function mapDisplayKeyToSettingKey(key: string) {
  switch (key) {
    case 'enter':
      return 'ctrl';
    case 'shift':
      return 'shift';
    default:
      return null;
  }
}

function normalizeBirthDate(value?: string) {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/\s*[./]\s*/g, '-');
}

function normalizeAvatarType(value?: string | null) {
  switch (value) {
    case 'character_1':
      return 'character01';
    case 'character_2':
      return 'character02';
    case 'character_3':
      return 'character03';
    case 'character_4':
      return 'character04';
    case 'character_5':
      return 'character05';
    case 'character_6':
      return 'character06';
    case 'character_7':
      return 'character07';
    case 'character_8':
      return 'character08';
    case 'character01':
    case 'character02':
    case 'character03':
    case 'character04':
    case 'character05':
    case 'character06':
    case 'character07':
    case 'character08':
      return value;
    default:
      return AVATAR_OPTIONS[0];
  }
}

function toApiAvatarType(value?: string | null) {
  switch (normalizeAvatarType(value)) {
    case 'character01':
      return 'character_1';
    case 'character02':
      return 'character_2';
    case 'character03':
      return 'character_3';
    case 'character04':
      return 'character_4';
    case 'character05':
      return 'character_5';
    case 'character06':
      return 'character_6';
    case 'character07':
      return 'character_7';
    case 'character08':
      return 'character_8';
    default:
      return 'character_1';
  }
}

export function useMyPage() {
  const navigate = useNavigate();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [dashboard, setDashboard] = useState<LearningDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<MyPageDialog>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [profileForm, setProfileForm] = useState<UpdateMyProfileRequest>({
    nickname: '',
    birth_date: '',
    gender: undefined,
    avatar_type: AVATAR_OPTIONS[0],
  });
  const [passwordForm, setPasswordForm] = useState<ChangeMyPasswordRequest>({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [pendingKeySelection, setPendingKeySelection] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    let isCancelled = false;

    const loadMyPage = async () => {
      setIsLoading(true);
      setPageError('');

      try {
        const [profileResponse, settingsResponse, dashboardResponse] = await Promise.all([
          getMyProfile(),
          getMySettings(),
          getLearningDashboard(),
        ]);

        if (isCancelled) {
          return;
        }

        setProfile(profileResponse.data);
        setSettings(settingsResponse.data);
        setDashboard(dashboardResponse);
        setProfileForm({
          nickname: profileResponse.data.nickname,
          birth_date: profileResponse.data.birth_date || '',
          gender: profileResponse.data.gender,
          avatar_type: normalizeAvatarType(profileResponse.data.avatar_type),
        });
        setUser(mapProfileToAuthUser(profileResponse.data));
      } catch (error) {
        if (!isCancelled) {
          setPageError(
            extractErrorMessage(error, '마이페이지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMyPage();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isHydrated, setUser]);

  useEffect(() => {
    if (dialog !== null) {
      setNotice('');
    }
  }, [dialog]);

  useEffect(() => {
    if (!notice || dialog !== null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice('');
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [dialog, notice]);

  useEffect(() => {
    if (dialog !== 'settings' || !pendingKeySelection) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const nextKey = mapDisplayKeyToSettingKey(key);

      if (!nextKey) {
        setNotice('Enter, Shift 키만 설정할 수 있습니다.');
        return;
      }

      event.preventDefault();
      setPendingKeySelection(nextKey);
      setNotice(
        `${key.toUpperCase()} 키를 선택했습니다.`,
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, pendingKeySelection]);

  const stats = useMemo<LearningStats>(() => {
    const sessions = dashboard?.sessions ?? [];

    return {
      completedVideoCount: sessions.length,
      totalStudySeconds: dashboard?.summary?.total_study_duration_seconds ?? 0,
      averageWatchRate: sessions.length
        ? sessions.reduce((sum, item) => sum + item.watch_rate, 0) / sessions.length
        : 0,
    };
  }, [dashboard]);

  const openDialog = (nextDialog: Exclude<MyPageDialog, 'passwordSuccess' | 'deleteSuccess' | null>) => {
    setNotice('');
    setDialog(nextDialog);
      if ((nextDialog === 'profile' || nextDialog === 'avatar') && profile) {
        setProfileForm({
          nickname: profile.nickname,
          birth_date: profile.birth_date || '',
          gender: profile.gender,
          avatar_type: normalizeAvatarType(profile.avatar_type),
        });
      }
    if (nextDialog === 'password') {
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    }
    if (nextDialog === 'settings') {
      setPendingKeySelection(settings?.fidget_toggle_key ?? null);
    }
    if (nextDialog === 'delete') {
      setDeletePassword('');
    }
  };

  const closeDialog = () => {
    setDialog(null);
    setPendingKeySelection(null);
    setNotice('');
  };

  const saveProfile = async () => {
    if (!profileForm.nickname?.trim()) {
      setNotice('이름을 입력해 주세요.');
      return;
    }

    setIsSavingProfile(true);
    setNotice('');

      try {
        await updateMyProfile({
          nickname: profileForm.nickname.trim(),
          birth_date: normalizeBirthDate(profileForm.birth_date),
          gender: profileForm.gender,
          avatar_type: toApiAvatarType(profileForm.avatar_type),
        });
      const refreshed = await getMyProfile();
      setProfile(refreshed.data);
      setUser(mapProfileToAuthUser(refreshed.data));
      setDialog(null);
      setNotice('개인정보 수정이 완료되었습니다.');
    } catch (error) {
      setNotice(extractErrorMessage(error, '개인정보 수정에 실패했습니다.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.new_password_confirm
    ) {
      setNotice('비밀번호 입력을 모두 완료해 주세요.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setNotice('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSavingPassword(true);
    setNotice('');

    try {
      await changeMyPassword(passwordForm);
      setDialog('passwordSuccess');
    } catch (error) {
      setNotice(extractErrorMessage(error, '비밀번호 변경에 실패했습니다.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const confirmPasswordChange = async () => {
    await logout({ revokeToken: false, redirectToLogin: false });
    navigate(ROUTES.LOGIN);
  };

  const saveSettings = async () => {
    if (!pendingKeySelection) {
      setNotice('설정할 키를 먼저 선택해 주세요.');
      return;
    }

    setIsSavingSettings(true);
    setNotice('');

    try {
      const response = await updateMySettings({ fidget_toggle_key: pendingKeySelection });
      setSettings(response.data);
      setDialog(null);
      setNotice('환경설정이 저장되었습니다.');
    } catch (error) {
      setNotice(extractErrorMessage(error, '환경설정 저장에 실패했습니다.'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const removeAccount = async () => {
    if (!deletePassword) {
      setNotice('비밀번호를 입력해 주세요.');
      return;
    }

    setIsDeletingAccount(true);
    setNotice('');

    try {
      await deleteMyAccount({ password: deletePassword });
      setDialog('deleteSuccess');
    } catch (error) {
      setNotice(extractErrorMessage(error, '회원 탈퇴에 실패했습니다.'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = async () => {
    await logout({ revokeToken: false, redirectToLogin: false });
    navigate(ROUTES.ONBOARDING);
  };

  const logoutToOnboarding = async () => {
    await logout({ redirectToLogin: false });
    navigate(ROUTES.ONBOARDING);
  };

  return {
    avatarOptions: AVATAR_OPTIONS,
    fidgetKeyOptions: FIDGET_KEY_OPTIONS,
    authUser,
    profile,
    settings,
    dashboard,
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
  };
}
