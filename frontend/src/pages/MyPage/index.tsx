import { PageHeader } from '../../components/common/PageHeader';
import LearningHistory from '../../features/mypage/LearningHistory';
import UserProfile from '../../features/mypage/UserProfile';
import { useMyPage } from '../../features/mypage/useMyPage';

function MyPage() {
  const { user, learningHistory } = useMyPage();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="마이페이지"
        title="학습 기록과 사용자 정보를 확인하세요"
        description="프로필 정보, 학습 이력, 이후 확장될 통계 영역을 위한 skeleton 페이지입니다."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <UserProfile user={user} />
        <LearningHistory items={learningHistory} />
      </div>
    </div>
  );
}

export default MyPage;
