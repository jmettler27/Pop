import { useMemo } from 'react';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import ActiveMatchingQuestionGrid from '@/frontend/components/game/main-pane/question/matching/ActiveMatchingQuestionGrid';
import { generateShuffledNodePositions } from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import { usePlayableQuestion } from '@/frontend/hooks/usePlayableQuestion';
import useTeam from '@/frontend/hooks/useTeam';
import { Chooser } from '@/models/chooser';
import { MatchingAnswer, MatchingQuestion } from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';

export default function MobileMatchingControl() {
  const myTeam = useTeam();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = usePlayableQuestion(
    roundId,
    QuestionType.MATCHING,
    questionId
  );

  const { chooser, loading: chooserLoading, error: chooserError } = useChooser(gameId);

  const bq = baseQuestion as MatchingQuestion | undefined;
  const numCols = bq?.numCols;
  const numRows = bq?.numRows;

  const nodePositions = useMemo(
    () => (numCols != null && numRows != null ? generateShuffledNodePositions(numCols, numRows) : []),
    [numCols, numRows]
  );

  if (baseQuestionError || chooserError) return <ErrorScreen inline />;
  if (baseQuestionLoading || chooserLoading) return <Spinner />;
  if (!baseQuestion || !chooser) return null;
  if (numCols == null || numRows == null) return null;

  const chooserData = chooser as unknown as Chooser;
  const chooserTeamId = chooserData.chooserOrder[chooserData.chooserIdx] ?? '';
  const isChooser = myTeam === chooserTeamId;

  if (!isChooser) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <span className="text-xl 2xl:text-4xl font-bold">
          <GameChooserHelperText chooserTeamId={chooserTeamId} />
        </span>
      </div>
    );
  }

  const answer = bq!.answer as MatchingAnswer;

  return <ActiveMatchingQuestionGrid answer={answer} nodePositions={nodePositions} numCols={numCols} />;
}
