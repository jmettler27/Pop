'use client';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import {
  OddOneOutProposalList,
  OddOneOutQuestionHeader,
} from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutCommon';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { useTimer } from '@/frontend/hooks/firestore/timer/useTimerHooks';
import { useIsChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useGameId from '@/frontend/hooks/useGameId';
import useTeam from '@/frontend/hooks/useTeam';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';

interface OddOneOutPlayerPaneProps {
  baseQuestion: OddOneOutQuestion;
  gameQuestion: GameOddOneOutQuestion;
  randomMapping: number[];
}

export default function OddOneOutPlayerPane({ baseQuestion, gameQuestion, randomMapping }: OddOneOutPlayerPaneProps) {
  const gameId = useGameId();
  const myTeam = useTeam();
  const { isChooser, loading: chooserLoading, error: chooserError } = useIsChooser(gameId, myTeam as string);
  const { timer, timerLoading, timerError } = useTimer(gameId);

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
