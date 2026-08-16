'use client';

import { useParams } from 'next/navigation';

import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { useIntl } from 'react-intl';

import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import { rankingToEmoji } from '@/frontend/helpers/emojis';
import { useScoresOnce } from '@/frontend/hooks/firestore/score/useRoundScoreHooks';
import { useTimer } from '@/frontend/hooks/firestore/timer/useTimerHooks';
import { useAllTeamsOnce } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useTeam from '@/frontend/hooks/useTeam';
import defineMessages from '@/frontend/i18n/defineMessages';
import { RankingDifferences } from '@/models/scores';

const messages = defineMessages('frontend.game.mobile.MobileRoundEndScreen', {
  waitingMessage: 'Waiting for the organizer...',
  gameScore: 'Your current score:',
  rankingUnchanged: 'Ranking unchanged',
});

export default function MobileRoundEndScreen() {
  const intl = useIntl();
  const { id } = useParams();
  const gameId = id as string;
  const game = useGame();
  const gameRepositories = useGameRepositories();
  const myTeamId = useTeam();

  const { teams, loading: teamsLoading, error: teamsError } = useAllTeamsOnce(gameRepositories?.teamRepo ?? null);
  const { timer, timerLoading, timerError } = useTimer(gameRepositories?.timerRepo ?? null);

  const currentRoundId = (game?.currentRound as string | undefined) ?? '';
  const roundScoreRepo = new RoundScoreRepository(gameId, currentRoundId);
  const { roundScores, loading: scoresLoading, error: scoresError } = useScoresOnce(roundScoreRepo);

  if (!game || !gameRepositories || !myTeamId) return null;

  if (teamsError || timerError || scoresError) return null;
  if (teamsLoading || timerLoading || scoresLoading) return null;
  if (!teams || !timer || !roundScores) return null;

  const gameSortedTeams = (roundScores as Record<string, unknown>).gameSortedTeams as {
    teams: string[];
    score: number;
  }[];
  const rankingDiffs = (roundScores as Record<string, unknown>).rankingDiffs as RankingDifferences | undefined;

  const myRankIndex = gameSortedTeams.findIndex((item) => item.teams.includes(myTeamId));
  const myEntry = gameSortedTeams[myRankIndex];
  const myTeam = teams.find((t) => t.id === myTeamId);
  const myRankDiff = rankingDiffs?.[myTeamId];

  if (!myEntry || !myTeam) return null;

  return (
    <div className="flex flex-col items-center gap-4 flex-1 justify-center">
      <span className="text-6xl">{rankingToEmoji(myRankIndex)}</span>
      <span className="text-2xl font-bold" style={{ color: myTeam.color }}>
        {myTeam.name}
      </span>
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg text-slate-400">{intl.formatMessage(messages.gameScore)}</span>
        <span className="text-4xl font-bold text-white">{myEntry.score}</span>
      </div>
      {myRankDiff != null && (
        <RankDiffBadge rankDiff={myRankDiff} rankingUnchangedLabel={intl.formatMessage(messages.rankingUnchanged)} />
      )}
    </div>
  );
}

function RankDiffBadge({ rankDiff, rankingUnchangedLabel }: { rankDiff: number; rankingUnchangedLabel: string }) {
  if (rankDiff === 0) {
    return (
      <div className="flex items-center gap-1 text-slate-400">
        <Minus />
        <i>{rankingUnchangedLabel}</i>
      </div>
    );
  }
  if (rankDiff > 0) {
    return (
      <div className="flex items-center gap-1 text-green-400 text-lg font-semibold">
        <ChevronUp />
        <span>+{rankDiff}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-red-400 text-lg font-semibold">
      <ChevronDown />
      <span>{rankDiff}</span>
    </div>
  );
}
