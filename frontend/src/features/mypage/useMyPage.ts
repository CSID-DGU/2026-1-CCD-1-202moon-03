import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { getLearningHistory } from '../../services/analytic.api';
import { getSessionDetail } from '../../services/session.api';
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
  LearningHistoryItem,
  UpdateMyProfileRequest,
  UserProfileData,
  UserSettingsData,
} from '../../types';

const AVATAR_OPTIONS = ['character_1', 'character_2', 'character_3', 'character_4'] as const;
const FIDGET_KEY_OPTIONS = ['alt', 'ctrl', 'shift'] as const;

type MyPageDialog = 'profile' | 'password' | 'settings' | 'delete' | 'passwordSuccess' | 'deleteSuccess' | null;

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
    case 'a':
      return 'ctrl';
    case 'b':
      return 'shift';
    case 'd':
      return 'alt';
    default:
      return null;
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
  const [history, setHistory] = useState<LearningHistoryItem[]>([]);
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
        const [profileResponse, settingsResponse, historyResponse] = await Promise.all([
          getMyProfile(),
          getMySettings(),
          getLearningHistory(),
        ]);

        if (isCancelled) {
          return;
        }

        setProfile(profileResponse.data);
        setSettings(settingsResponse.data);
        setHistory(historyResponse.data);
        setProfileForm({
          nickname: profileResponse.data.nickname,
          avatar_type: profileResponse.data.avatar_type || AVATAR_OPTIONS[0],
        });
        setUser(mapProfileToAuthUser(profileResponse.data));
      } catch (error) {
        if (!isCancelled) {
          setPageError(
            extractErrorMessage(error, '마이페이지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'),
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
    setNotice('');
  }, [dialog]);

  useEffect(() => {
    if (dialog !== 'settings' || !pendingKeySelection) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const nextKey = mapDisplayKeyToSettingKey(key);

      if (!nextKey) {
        setNotice('현재는 D, A, B 키만 설정할 수 있어요.');
        return;
      }

      event.preventDefault();
      setPendingKeySelection(nextKey);
      setNotice(
        `선택된 키: ${key.toUpperCase()}`,
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, pendingKeySelection]);

  const stats = useMemo<LearningStats>(() => {
    return {
      completedVideoCount: history.length,
      totalStudySeconds: 0,
      averageWatchRate: history.length
        ? history.reduce((sum, item) => sum + item.watch_rate, 0) / history.length
        : 0,
    };
  }, [history]);

  useEffect(() => {
    if (!history.length) {
      return;
    }

    let isCancelled = false;

    const loadDurations = async () => {
      const detailResults = await Promise.allSettled(
        history.map((item) => getSessionDetail(item.session_id)),
      );

      if (isCancelled) {
        return;
      }

      const totalStudySeconds = detailResults.reduce((sum, result, index) => {
        if (result.status !== 'fulfilled') {
          return sum;
        }

        const durationSec = result.value.data.duration_sec ?? 0;
        const watchRate = history[index]?.watch_rate ?? 0;
        return sum + durationSec * Math.max(0, Math.min(1, watchRate));
      }, 0);

      setComputedStats((current) => ({
        ...current,
        totalStudySeconds,
      }));
    };

    void loadDurations();

    return () => {
      isCancelled = true;
    };
  }, [history]);

  const [computedStats, setComputedStats] = useState<LearningStats>({
    completedVideoCount: 0,
    totalStudySeconds: 0,
    averageWatchRate: 0,
  });

  useEffect(() => {
    setComputedStats(stats);
  }, [stats]);

  const openDialog = (nextDialog: Exclude<MyPageDialog, 'passwordSuccess' | 'deleteSuccess' | null>) => {
    setNotice('');
    setDialog(nextDialog);
    if (nextDialog === 'profile' && profile) {
      setProfileForm({
        nickname: profile.nickname,
        avatar_type: profile.avatar_type || AVATAR_OPTIONS[0],
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
      setNotice('이름을 입력해주세요.');
      return;
    }

    setIsSavingProfile(true);
    setNotice('');

    try {
      await updateMyProfile({
        nickname: profileForm.nickname.trim(),
        avatar_type: profileForm.avatar_type,
      });
      const refreshed = await getMyProfile();
      setProfile(refreshed.data);
      setUser(mapProfileToAuthUser(refreshed.data));
      setDialog(null);
      setNotice('개인정보가 수정되었습니다.');
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
      setNotice('비밀번호 입력을 모두 완료해주세요.');
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
      setNotice('설정할 키를 먼저 선택해주세요.');
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
      setNotice('비밀번호를 입력해주세요.');
      return;
    }

    setIsDeletingAccount(true);
    setNotice('');

    try {
      await deleteMyAccount({ password: deletePassword });
      setDialog('deleteSuccess');
    } catch (error) {
      setNotice(extractErrorMessage(error, '회원탈퇴에 실패했습니다.'));
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
    history,
    stats: computedStats,
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
