import { useGameContext } from '@/frontend/contexts';
import { useGameRepositoriesContext } from '@/frontend/contexts';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.middle.GameEndMiddlePane', {
  itWas: 'It was',
});

import LoadingScreen from '@/frontend/components/LoadingScreen';
import GameScoreboard from '@/frontend/components/scores/GameScoreboard';
import GameScoresChart from '@/frontend/components/scores/GameScoresChart';
import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';

export default function GameEndMiddlePane({}) {
  const game = useGameContext();
  const intl = useIntl();

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
  const game = useGameContext();

  const { roundRepo, teamRepo, scoreRepo } = useGameRepositoriesContext();
  const roundScoreRepo = new RoundScoreRepository(game.id, game.currentRound);

  const {
    round: finalRound,
    loading: finalRoundLoading,
    error: finalRoundError,
  } = roundRepo.useRoundOnce(game.currentRound);

  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams();

  const { roundScores, loading: roundScoresLoading, error: roundScoresError } = roundScoreRepo.useScoresOnce();

  if (finalRoundError || teamsError || roundScoresError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(finalRoundError || teamsError || roundScoresError)}</strong>
      </p>
    );
  }
  if (finalRoundLoading || teamsLoading || roundScoresLoading) {
    return <LoadingScreen />;
  }
  if (!finalRound || !teams || !roundScores) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-11/12 w-1/2 items-center justify-center">
        <GameScoreboard roundScores={roundScores} teams={teams} />
      </div>
      <div className="flex flex-col h-full w-1/2 items-center justify-center mr-4">
        <GameScoresChart currentRoundOrder={finalRound.order} teams={teams} />
      </div>
    </div>
  );
}
