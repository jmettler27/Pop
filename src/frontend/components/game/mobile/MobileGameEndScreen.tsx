'use client';

import { useParams } from 'next/navigation';

import { useIntl } from 'react-intl';

import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import GameScoreboard from '@/frontend/components/scores/GameScoreboard';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
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
  const gameRepositories = useGameRepositories();

  if (!game || !gameRepositories) return null;

  const { teamRepo } = gameRepositories;
  const currentRoundId = game instanceof GameRounds ? (game.currentRound as string) : undefined;

  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams();
  const roundScoreRepo = new RoundScoreRepository(gameId, currentRoundId as string);
  const { roundScores, loading: scoresLoading, error: scoresError } = roundScoreRepo.useScoresOnce();

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
