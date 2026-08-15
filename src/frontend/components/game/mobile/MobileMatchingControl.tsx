import { useMemo } from 'react';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import ActiveMatchingQuestionGrid from '@/frontend/components/game/main-pane/question/matching/ActiveMatchingQuestionGrid';
import { generateShuffledNodePositions } from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestionOnce } from '@/frontend/hooks/firestore/question/useBaseQuestionHooks';
import { useChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useGame from '@/frontend/hooks/useGame';
import useTeam from '@/frontend/hooks/useTeam';
import { Chooser } from '@/models/chooser';
import { MatchingAnswer, MatchingQuestion } from '@/models/questions/matching';

export default function MobileMatchingControl() {
  const myTeam = useTeam();
  const game = useGame();

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useQuestionOnce(game!.currentQuestion as string);

  const { chooser, loading: chooserLoading, error: chooserError } = useChooser(game?.id ?? null);

  const bq = baseQuestion as MatchingQuestion | undefined;
  const numCols = bq?.numCols;
  const numRows = bq?.numRows;

  const nodePositions = useMemo(
    () => (numCols != null && numRows != null ? generateShuffledNodePositions(numCols, numRows) : []),
    [numCols, numRows]
  );

  if (!game) return null;
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
