import { Fragment } from 'react';

import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { scoreboardMessages } from '@/frontend/components/scores/scoreboardUtils';
import { rankingToEmoji } from '@/frontend/helpers/emojis';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameRounds } from '@/models/games/game';
import { RoundType } from '@/models/rounds/round-type';
import { ScorePolicyType } from '@/models/score-policy';
import Team from '@/models/team';

interface RoundScoreItem {
  teams: string[];
  score: number;
  reward: number;
}

interface RoundScores {
  roundSortedTeams: RoundScoreItem[];
  roundCompletionRates: Record<string, number>;
  [key: string]: unknown;
}

interface RoundScoreboardProps {
  roundScores: RoundScores;
  teams: Team[];
}

export default function RoundScoreboard({ roundScores, teams }: RoundScoreboardProps) {
  const intl = useIntl();
  const { roundSortedTeams } = roundScores;
  const game = useGame();

  const repos = useGameRepositories();
  if (!repos) return <></>;
  const { roundRepo } = repos;
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const { round, loading, error } = roundRepo.useRoundOnce(currentRound ?? '');
  if (error || loading || !round || !currentRound) {
    return <></>;
  }

  const completionRounds = [
    RoundType.BASIC,
    RoundType.BLINDTEST,
    RoundType.EMOJI,
    RoundType.ENUMERATION,
    RoundType.ESTIMATION,
    RoundType.IMAGE,
    RoundType.LABELLING,
    RoundType.MCQ,
    RoundType.NAGUI,
    RoundType.PROGRESSIVE_CLUES,
    RoundType.QUOTE,
    RoundType.REORDERING,
    RoundType.MIXED,
  ];
  const isCompletionRound = completionRounds.includes(round.type as (typeof completionRounds)[number]);

  const gameRounds = game instanceof GameRounds ? game : null;

  return (
    <TableContainer component={Paper} className="w-2/3">
      <Table size="small" aria-label="round scores table">
        {/* Table head */}
        <TableHead>
          <TableRow>
            <TableCell className="2xl:text-2xl font-bold text-center">
              {intl.formatMessage(scoreboardMessages.ranking)}
            </TableCell>
            <TableCell className="2xl:text-2xl font-bold">{intl.formatMessage(scoreboardMessages.team)}</TableCell>
            <TableCell className="2xl:text-2xl font-bold text-center">
              {intl.formatMessage(scoreboardMessages.score)}
            </TableCell>
            {gameRounds?.roundScorePolicy === ScorePolicyType.RANKING && (
              <TableCell className="2xl:text-2xl font-bold text-center">
                {intl.formatMessage(scoreboardMessages.reward)}
              </TableCell>
            )}
            {gameRounds?.roundScorePolicy === ScorePolicyType.COMPLETION_RATE && isCompletionRound && (
              <TableCell className="2xl:text-2xl font-bold text-center">
                {intl.formatMessage(scoreboardMessages.completion)}
              </TableCell>
            )}
          </TableRow>
        </TableHead>

        {/* Table body */}
        <TableBody>
          {roundSortedTeams.map((item, idx) => (
            <Fragment key={idx}>
              <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell className="2xl:text-3xl text-center" scope="row" rowSpan={item.teams.length + 1}>
                  {rankingToEmoji(idx)}
                </TableCell>
              </TableRow>

              {item.teams.map((teamId) => {
                const teamData = teams.find((team) => team.id === teamId);
                if (!teamData) return null;
                const hasEarnedPoints = item.reward > 0;
                const hasLostPoints = item.reward < 0;
                return (
                  <TableRow key={teamId}>
                    <TableCell className="text-xs sm:text-sm 2xl:text-base" sx={{ color: teamData.color }}>
                      {teamData.name}
                    </TableCell>

                    <TableCell className="2xl:text-2xl text-center">{item.score}</TableCell>

                    <TableCell className="2xl:text-2xl text-center font-bold">
                      {gameRounds?.roundScorePolicy === ScorePolicyType.RANKING && (
                        <span className={clsx(hasEarnedPoints && 'text-green-500', hasLostPoints && 'text-red-500')}>
                          {hasEarnedPoints && '+'}
                          {item.reward}
                        </span>
                      )}
                      {gameRounds?.roundScorePolicy === ScorePolicyType.COMPLETION_RATE && isCompletionRound && (
                        <span>{roundScores.roundCompletionRates[teamId]}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
