import { useMemo } from 'react';

import BaseOddOneOutQuestionRepository from '@/backend/repositories/question/BaseOddOneOutQuestionRepository';
import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import { shuffleIndices } from '@/backend/utils/arrays';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import { OddOneOutChooserStatusText } from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutBottomPane';
import { OddOneOutProposalList } from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutCommon';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useTeam from '@/frontend/hooks/useTeam';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';

export default function MobileOddOneOutControl() {
  const game = useGame();

  const baseQuestionRepo = new BaseOddOneOutQuestionRepository();
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(
    game!.currentQuestion as string
  );

  const bq = baseQuestion as unknown as OddOneOutQuestion;
  const randomMapping = useMemo(() => shuffleIndices((bq?.items ?? []).length), [bq?.items]);

  if (baseQuestionError) return <ErrorScreen inline />;
  if (baseQuestionLoading) return <LoadingScreen inline />;
  if (!baseQuestion) return null;

  return <MobileOddOneOutWithQuestion baseQuestion={bq} randomMapping={randomMapping} />;
}

function MobileOddOneOutWithQuestion({
  baseQuestion,
  randomMapping,
}: {
  baseQuestion: OddOneOutQuestion;
  randomMapping: number[];
}) {
  const myTeam = useTeam();
  const gameRepositories = useGameRepositories();

  if (!gameRepositories) return null;
  const { chooserRepo } = gameRepositories;

  const { currentChooserTeamId, loading: chooserLoading, error: chooserError } = chooserRepo.useCurrentChooser();
  if (chooserError) return <ErrorScreen inline />;
  if (chooserLoading) return <LoadingScreen inline />;
  if (!currentChooserTeamId) return <></>;

  return currentChooserTeamId === myTeam ? (
    <MobileOddOneOutChooserControl baseQuestion={baseQuestion} randomMapping={randomMapping} />
  ) : (
    <MobileOddOneOutNonChooserControl chooserTeamId={currentChooserTeamId} />
  );
}

function MobileOddOneOutChooserControl({
  baseQuestion,
  randomMapping,
}: {
  baseQuestion: OddOneOutQuestion;
  randomMapping: number[];
}) {
  const game = useGame();
  const gameRepositories = useGameRepositories();

  if (!gameRepositories) return null;
  const { timerRepo } = gameRepositories;

  const gameQuestionRepo = new GameOddOneOutQuestionRepository(game?.id as string, game?.currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game?.currentQuestion as string);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (gameQuestionError || timerError) return <ErrorScreen inline />;
  if (gameQuestionLoading || timerLoading) return <LoadingScreen inline />;
  if (!gameQuestion || !timer) return <></>;

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <OddOneOutChooserStatusText authorized={timer.authorized} />
      <OddOneOutProposalList
        baseQuestion={baseQuestion}
        randomization={randomMapping}
        gameQuestion={gameQuestion as unknown as GameOddOneOutQuestion}
        isChooser={true}
        authorized={timer.authorized}
        listClassName="rounded-lg w-[92vw] max-h-[75dvh] overflow-y-auto mb-3"
      />
    </div>
  );
}

function MobileOddOneOutNonChooserControl({ chooserTeamId }: { chooserTeamId: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <span className="text-xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}
