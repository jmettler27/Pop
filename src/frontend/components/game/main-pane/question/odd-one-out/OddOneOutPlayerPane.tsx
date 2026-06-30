'use client';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import {
  OddOneOutProposalList,
  OddOneOutQuestionHeader,
} from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutCommon';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useTeam from '@/frontend/hooks/useTeam';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';

interface OddOneOutPlayerPaneProps {
  baseQuestion: OddOneOutQuestion;
  gameQuestion: GameOddOneOutQuestion;
  randomMapping: number[];
}

export default function OddOneOutPlayerPane({ baseQuestion, gameQuestion, randomMapping }: OddOneOutPlayerPaneProps) {
  const game = useGame();
  const myTeam = useTeam();
  const gameRepositories = useGameRepositories();

  if (!gameRepositories) return null;
  const { chooserRepo, timerRepo } = gameRepositories;

  const { isChooser, loading: chooserLoading, error: chooserError } = chooserRepo.useIsChooser(myTeam as string);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (chooserError || timerError) return <ErrorScreen inline />;
  if (chooserLoading || timerLoading) return <LoadingScreen inline />;
  if (!timer) return <></>;

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <OddOneOutQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        <OddOneOutProposalList
          baseQuestion={baseQuestion}
          randomization={randomMapping}
          gameQuestion={gameQuestion}
          isChooser={isChooser ?? false}
          authorized={timer.authorized}
        />
      </div>
    </div>
  );
}
