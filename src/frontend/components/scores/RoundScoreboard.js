import { QuestionType } from '@/backend/models/questions/QuestionType';

import { rankingToEmoji } from '@/backend/utils/emojis';

import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import { useIntl } from 'react-intl';

import { scoreboardMessages } from '@/frontend/components/scores/scoreboardUtils';

import { Fragment } from 'react';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

import clsx from 'clsx';

export default function RoundScoreboard({ roundScores, teams }) {
  const intl = useIntl();
  const { roundSortedTeams } = roundScores;
  const game = useGameContext();

  const { roundRepo } = useGameRepositoriesContext();
  const { round, loading, error } = roundRepo.useRoundOnce(game.currentRound);
  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <p>Loading round...</p>;
  }
  if (!round) {
    return <></>;
  }

  const completionRounds = [
    QuestionType.PROGRESSIVE_CLUES,
    QuestionType.IMAGE,
    QuestionType.EMOJI,
    QuestionType.BLINDTEST,
    QuestionType.QUOTE,
    QuestionType.LABELLING,
    QuestionType.ENUMERATION,
    QuestionType.MCQ,
    QuestionType.NAGUI,
    QuestionType.BASIC,
    QuestionType.MIXED,
  ];
  const isCompletionRound = completionRounds.includes(round.type);

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
            {game.roundScorePolicy === 'ranking' && (
              <TableCell className="2xl:text-2xl font-bold text-center">
                {intl.formatMessage(scoreboardMessages.reward)}
              </TableCell>
            )}
            {game.roundScorePolicy === 'completion_rate' && isCompletionRound && (
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
                const hasEarnedPoints = item.reward > 0;
                const hasLostPoints = item.reward < 0;
                return (
                  <TableRow key={teamId}>
                    <TableCell className="text-xs sm:text-sm 2xl:text-base 2xl:text-xl" sx={{ color: teamData.color }}>
                      {teamData.name}
                    </TableCell>

                    <TableCell className="2xl:text-2xl text-center">{item.score}</TableCell>

                    <TableCell className="2xl:text-2xl text-center font-bold">
                      {game.roundScorePolicy === 'ranking' && (
                        <span className={clsx(hasEarnedPoints && 'text-green-500', hasLostPoints && 'text-red-500')}>
                          {hasEarnedPoints && '+'}
                          {item.reward}
                        </span>
                      )}
                      {game.roundScorePolicy === 'completion_rate' && isCompletionRound && (
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
