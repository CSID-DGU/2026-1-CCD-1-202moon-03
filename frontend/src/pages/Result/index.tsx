import { PageHeader } from '../../components/common/PageHeader';
import KeywordHighlight from '../../features/result/KeywordHighlight';
import ResultSummary from '../../features/result/ResultSummary';
import { useResult } from '../../features/result/useResult';

function ResultPage() {
  const { title, summary, highlightedKeywords } = useResult();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Result"
        title="Review your learning outcome"
        description="This page reserves the post-session analysis layer for scores, feedback, and keyword insight."
      />
      <ResultSummary title={title} summary={summary} />
      <KeywordHighlight keywords={highlightedKeywords} />
    </div>
  );
}

export default ResultPage;
