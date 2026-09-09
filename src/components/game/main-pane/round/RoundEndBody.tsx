'use client';

import { useIntl } from 'react-intl';

import ErrorScreen from '@/components/ErrorScreen';
import LoadingScreen from '@/components/LoadingScreen';
import GameScoreboard from '@/components/scores/GameScoreboard';
import GameScoresChart from '@/components/scores/GameScoresChart';
import RoundScoreboard from '@/components/scores/RoundScoreboard';
import RoundScoresChart from '@/components/scores/RoundScoresChart';
import { useScoresOnce } from '@/hooks/firestore/score/useRoundScoreHooks';
import { useAllTeamsOnce } from '@/hooks/firestore/user/useTeamHooks';
import useGameId from '@/hooks/useGameId';
import defineMessages from '@/i18n/defineMessages';
import { AnyRound } from '@/models/rounds/RoundFactory';

const messages = defineMessages('frontend.game.middle.RoundEndBody', {
  roundStats: 'Round statistics',
  gameStats: 'Game statistics',
});

export default function RoundEndBody({ currentRound }: { currentRound: AnyRound }) {
  const gameId = useGameId();
  const intl = useIntl();

  const { teams, loading: teamsLoading, error: teamsError } = useAllTeamsOnce(gameId);

  const {
    roundScores,
    loading: roundScoresLoading,
    error: roundScoresError,
  } = useScoresOnce(gameId, currentRound.id as string);

  if (teamsError) {
    return <ErrorScreen inline />;
  }
  if (roundScoresError) {
    return <ErrorScreen inline />;
  }
  if (teamsLoading || roundScoresLoading) {
    return <LoadingScreen inline />;
  }
  if (!teams || !roundScores) {
    return <></>;
  }

  const typedRoundScores = roundScores as unknown as Parameters<typeof RoundScoreboard>[0]['roundScores'];

  return (
    <div className="flex flex-col h-full w-full items-center justify-around overflow-auto">
      {/* Round statistics */}
      <div className="flex flex-col h-1/2 w-full items-center justify-center">
        <div className="flex flex-col h-[10%] w-full items-center justify-center">
          <h1 className="2xl:text-3xl text-yellow-300">{intl.formatMessage(messages.roundStats)}</h1>
        </div>
        <div className="flex flex-row h-[90%] w-full items-center justify-center">
          <div className="flex flex-col h-full w-2/3 items-center justify-center">
            <RoundScoreboard roundScores={typedRoundScores} teams={teams} />
          </div>
          <div className="flex flex-col h-full w-1/2 items-center justify-center">
            <RoundScoresChart
              round={currentRound}
              roundScores={roundScores as unknown as Parameters<typeof RoundScoresChart>[0]['roundScores']}
              teams={teams}
            />
          </div>
        </div>
      </div>
      {/* Game statistics */}
      <div className="flex flex-col h-1/2 w-full items-center justify-center">
        <h1 className="2xl:text-3xl text-yellow-300">{intl.formatMessage(messages.gameStats)}</h1>
        <div className="flex flex-row h-[90%] w-full items-center justify-center">
          <div className="flex flex-col h-11/12 w-2/3 items-center justify-center">
            <GameScoreboard
              roundScores={roundScores as unknown as Parameters<typeof GameScoreboard>[0]['roundScores']}
              teams={teams}
            />
          </div>
          <div className="flex flex-col h-full w-1/2 items-center justify-center">
            <GameScoresChart currentRoundOrder={currentRound.order ?? 0} teams={teams} />
          </div>
        </div>
      </div>
    </div>
  );
}
