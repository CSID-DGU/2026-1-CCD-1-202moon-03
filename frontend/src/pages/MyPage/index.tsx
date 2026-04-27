import { PageHeader } from '../../components/common/PageHeader';
import LearningHistory from '../../features/mypage/LearningHistory';
import UserProfile from '../../features/mypage/UserProfile';
import { useMyPage } from '../../features/mypage/useMyPage';

function MyPage() {
  const { user, learningHistory } = useMyPage();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My Page"
        title="Track your study identity and history"
        description="This skeleton page gives us stable sections for profile data, session history, and future analytics widgets."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <UserProfile user={user} />
        <LearningHistory items={learningHistory} />
      </div>
    </div>
  );
}

export default MyPage;
