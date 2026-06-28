'use client';

import { clsx } from 'clsx';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import GameChooserTeamAnnouncement from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import {
  OddOneOutProposalList,
  OddOneOutQuestionHeader,
} from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutCommon';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useIsMobile from '@/frontend/hooks/useIsMobile';
import useTeam from '@/frontend/hooks/useTeam';
import { GameStatus } from '@/models/games/game-status';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';

interface OddOneOutPlayerPaneProps {
  baseQuestion: OddOneOutQuestion;
  gameQuestion: GameOddOneOutQuestion;
  randomMapping: number[];
}

export default function OddOneOutPlayerPane({ baseQuestion, gameQuestion, randomMapping }: OddOneOutPlayerPaneProps) {
  const game = useGame();
  const myTeam = useTeam();
  const isMobile = useIsMobile();
  const gameRepositories = useGameRepositories();

  if (!gameRepositories) return null;
  const { chooserRepo, timerRepo } = gameRepositories;

  const { isChooser, loading: chooserLoading, error: chooserError } = chooserRepo.useIsChooser(myTeam as string);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (chooserError || timerError) return <ErrorScreen inline />;
  if (chooserLoading || timerLoading) return <LoadingScreen inline />;
  if (!timer) return <></>;

  if (isMobile && !isChooser && game?.status === GameStatus.QUESTION_ACTIVE) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <span className="text-center font-bold text-xl">
          <GameChooserTeamAnnouncement />
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center">
      {!isMobile && (
        <div className="h-[15%] w-full flex flex-col items-center justify-center">
          <OddOneOutQuestionHeader baseQuestion={baseQuestion} />
        </div>
      )}
      <div className={clsx('w-full flex flex-col items-center justify-center', isMobile ? 'h-full' : 'h-[85%]')}>
        <OddOneOutProposalList
          baseQuestion={baseQuestion}
          randomization={randomMapping}
          gameQuestion={gameQuestion}
          isChooser={isChooser ?? false}
          authorized={timer.authorized}
          listClassName={isMobile ? 'rounded-lg w-[92vw] max-h-[75dvh] overflow-y-auto mb-3' : undefined}
        />
      </div>
    </div>
  );
}
