import { useIntl } from 'react-intl';

import ErrorScreen from '@/components/ErrorScreen';
import LoadingScreen from '@/components/LoadingScreen';
import GameScoreboard from '@/components/scores/GameScoreboard';
import GameScoresChart from '@/components/scores/GameScoresChart';
import { useRoundOnce } from '@/hooks/firestore/round/useRoundHooks';
import { useScoresOnce } from '@/hooks/firestore/score/useRoundScoreHooks';
import { useAllTeams } from '@/hooks/firestore/user/useTeamHooks';
import useGame from '@/hooks/useGame';
import defineMessages from '@/i18n/defineMessages';
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
  const { teams, loading: teamsLoading, error: teamsError } = useAllTeams(game?.id ?? null);

  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const {
    round: finalRound,
    loading: finalRoundLoading,
    error: finalRoundError,
  } = useRoundOnce(game?.id ?? null, (currentRound as string | undefined) ?? '');

  const {
    roundScores,
    loading: roundScoresLoading,
    error: roundScoresError,
  } = useScoresOnce(game?.id ?? null, (currentRound as string | undefined) ?? null);

  if (!game) return null;

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
