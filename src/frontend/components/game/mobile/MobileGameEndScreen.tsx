'use client';

import { useParams } from 'next/navigation';

import { useIntl } from 'react-intl';

import GameScoreboard from '@/frontend/components/scores/GameScoreboard';
import { useScoresOnce } from '@/frontend/hooks/firestore/score/useRoundScoreHooks';
import { useAllTeams } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';

const messages = defineMessages('frontend.game.mobile.MobileGameEndScreen', {
  congratulations: 'Congratulations! 🏆',
  gameScores: 'Final scores',
});

export default function MobileGameEndScreen() {
  const intl = useIntl();
  const { id } = useParams();
  const gameId = id as string;
  const game = useGame();
  const { teams, loading: teamsLoading, error: teamsError } = useAllTeams(gameId);

  const currentRoundId = game instanceof GameRounds ? (game.currentRound as string) : undefined;
  const { roundScores, loading: scoresLoading, error: scoresError } = useScoresOnce(gameId, currentRoundId ?? '');

  if (!game) return null;

  if (teamsError || scoresError) return null;
  if (teamsLoading || scoresLoading) return null;
  if (!teams || !roundScores) return null;

  return (
    <div className="flex flex-col items-center gap-6 h-full overflow-auto p-4">
      <h1 className="text-3xl font-bold text-yellow-300 shrink-0">{intl.formatMessage(messages.congratulations)}</h1>
      <h2 className="text-xl text-white shrink-0">{intl.formatMessage(messages.gameScores)}</h2>
      <GameScoreboard
        roundScores={roundScores as unknown as Parameters<typeof GameScoreboard>[0]['roundScores']}
        teams={teams}
      />
    </div>
  );
}
