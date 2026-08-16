import { useIntl } from 'react-intl';

import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import GameScoreboard from '@/frontend/components/scores/GameScoreboard';
import GameScoresChart from '@/frontend/components/scores/GameScoresChart';
import { useRoundOnce } from '@/frontend/hooks/firestore/round/useRoundHooks';
import { useScoresOnce } from '@/frontend/hooks/firestore/score/useRoundScoreHooks';
import { useAllTeams } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';

const messages = defineMessages('frontend.game.middle.GameEndMiddlePane', {
  itWas: 'It was',
});

export default function GameEndMiddlePane() {
  const game = useGame();
  const intl = useIntl();
  if (!game) return null;

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="flex h-[10%] w-full items-center justify-center mt-3">
        <h1 className="2xl:text-5xl font-bold">
          {intl.formatMessage(messages.itWas)} <span className="text-yellow-300 italic">{game.title}</span>
        </h1>
      </div>
      <div className="flex h-[90%] w-full items-center justify-center">
        <GameEndBody />
      </div>
    </div>
  );
}

function GameEndBody() {
  const game = useGame();
  const gameRepositories = useGameRepositories();
  const { teams, loading: teamsLoading, error: teamsError } = useAllTeams(gameRepositories?.teamRepo ?? null);

  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const {
    round: finalRound,
    loading: finalRoundLoading,
    error: finalRoundError,
  } = useRoundOnce(gameRepositories?.roundRepo ?? null, (currentRound as string | undefined) ?? '');

  const roundScoreRepo = new RoundScoreRepository(
    (game?.id as string | undefined) ?? '',
    (currentRound as string | undefined) ?? ''
  );
  const { roundScores, loading: roundScoresLoading, error: roundScoresError } = useScoresOnce(roundScoreRepo);

  if (!game) return null;
  if (!gameRepositories) return null;

  if (finalRoundError || teamsError || roundScoresError) {
    return <ErrorScreen inline />;
  }
  if (finalRoundLoading || teamsLoading || roundScoresLoading) {
    return <LoadingScreen inline />;
  }
  if (!finalRound || !teams || !roundScores) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-11/12 w-1/2 items-center justify-center">
        <GameScoreboard
          roundScores={roundScores as unknown as Parameters<typeof GameScoreboard>[0]['roundScores']}
          teams={teams}
        />
      </div>
      <div className="flex flex-col h-full w-1/2 items-center justify-center mr-4">
        <GameScoresChart currentRoundOrder={finalRound.order ?? 0} teams={teams} />
      </div>
    </div>
  );
}
