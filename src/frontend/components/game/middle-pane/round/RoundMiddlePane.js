import { GameStatus } from '@/backend/models/games/GameStatus';

import { RoundTypeIcon, ROUND_HEADER_TEXT } from '@/backend/utils/rounds';

import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import RoundStartBody from '@/frontend/components/game/middle-pane/round/round-start/RoundStartBody';
import RoundEndBody from '@/frontend/components/game/middle-pane/round/round-end/RoundEndBody';

import { useParams } from 'next/navigation';

export default function RoundMiddlePane() {
  const game = useGameContext();
  const params = useParams();

  const { roundRepo } = useGameRepositoriesContext();
  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound);

  if (roundError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundError)}</strong>
      </p>
    );
  }
  if (roundLoading) {
    return <LoadingScreen loadingText="Loading round..." />;
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

function RoundHeader({ round, lang = DEFAULT_LOCALE }) {
  return (
    <div className="flex flex-row items-center justify-center space-x-1">
      <RoundTypeIcon roundType={round.type} fontSize={50} />
      <h1 className="2xl:text-5xl">
        <span className="font-bold">
          {ROUND_HEADER_TEXT[lang]} {round.order + 1}
        </span>{' '}
        - <i>{round.title}</i>{' '}
      </h1>
    </div>
  );
}
