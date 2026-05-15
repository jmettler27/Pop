'use client';

import { useParams } from 'next/navigation';

import { useIntl } from 'react-intl';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import RoundEndBody from '@/frontend/components/game/main-pane/round/RoundEndBody';
import RoundStartBody from '@/frontend/components/game/main-pane/round/RoundStartBody';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { RoundTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import globalMessages from '@/frontend/i18n/globalMessages';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { AnyRound } from '@/models/rounds/RoundFactory';

export default function RoundMiddlePane() {
  const game = useGame();
  if (!game) return null;

  const params = useParams();
  const intl = useIntl();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { roundRepo } = gameRepositories;

  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound as string);
  console.log('Round in RoundMiddlePane', round);

  if (roundError) {
    return <ErrorScreen inline />;
  }
  if (roundLoading) {
    return <LoadingScreen inline />;
  }
  if (!round) {
    return <></>;
  }

  const SelectedRoundBody = () => {
    switch (game.status) {
      case GameStatus.ROUND_START:
        return <RoundStartBody round={round} />;
      case GameStatus.ROUND_END:
        return <RoundEndBody currentRound={round} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="flex h-[10%] w-full items-center justify-center mt-3">
        <RoundHeader round={round} />
      </div>
      <div className="flex h-[90%] w-full items-center justify-center">
        <SelectedRoundBody />
      </div>
    </div>
  );
}

function RoundHeader({ round }: { round: AnyRound }) {
  const intl = useIntl();
  return (
    <div className="flex flex-row items-center justify-center space-x-1">
      <RoundTypeIcon roundType={round.type!} fontSize={50} />
      <h1 className="2xl:text-5xl">
        <span className="font-bold">
          {intl.formatMessage(globalMessages.round)} {(round.order ?? 0) + 1}
        </span>{' '}
        - <i>{round.title}</i>{' '}
      </h1>
    </div>
  );
}
