import { useMemo } from 'react';

import { CircularProgress } from '@mui/material';

import BaseMatchingQuestionRepository from '@/backend/repositories/question/BaseMatchingQuestionRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import ActiveMatchingQuestionGrid from '@/frontend/components/game/main-pane/question/matching/ActiveMatchingQuestionGrid';
import { generateShuffledNodePositions } from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useTeam from '@/frontend/hooks/useTeam';
import { Chooser } from '@/models/chooser';
import { MatchingAnswer, MatchingQuestion } from '@/models/questions/matching';

export default function MobileMatchingControl() {
  const myTeam = useTeam();
  const game = useGame();
  const gameRepositories = useGameRepositories();

  const baseQuestionRepo = new BaseMatchingQuestionRepository();
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(
    game!.currentQuestion as string
  );

  const { chooserRepo } = gameRepositories ?? {};
  const { chooser, loading: chooserLoading, error: chooserError } = chooserRepo?.useChooser() ?? {};

  const bq = baseQuestion as MatchingQuestion | undefined;
  const numCols = bq?.numCols;
  const numRows = bq?.numRows;

  const nodePositions = useMemo(
    () => (numCols != null && numRows != null ? generateShuffledNodePositions(numCols, numRows) : []),
    [numCols, numRows]
  );

  if (!game || !gameRepositories) return null;
  if (baseQuestionError || chooserError) return <ErrorScreen inline />;
  if (baseQuestionLoading || chooserLoading) return <CircularProgress />;
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
