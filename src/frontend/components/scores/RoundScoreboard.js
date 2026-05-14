import { Fragment } from 'react';

import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { scoreboardMessages } from '@/frontend/components/scores/scoreboardUtils';
import { rankingToEmoji } from '@/frontend/helpers/emojis';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';

export default function RoundScoreboard({ roundScores, teams }) {
  const intl = useIntl();
  const { roundSortedTeams } = roundScores;
  const game = useGame();

  const { roundRepo } = useGameRepositories();
  const { round, loading, error } = roundRepo.useRoundOnce(game.currentRound);
  if (error || loading || !round) {
    return <></>;
  }

  const completionRounds = [
    QuestionType.BASIC,
    QuestionType.BLINDTEST,
    QuestionType.EMOJI,
    QuestionType.ENUMERATION,
    QuestionType.ESTIMATION,
    QuestionType.IMAGE,
    QuestionType.LABELLING,
    QuestionType.MCQ,
    QuestionType.NAGUI,
    QuestionType.PROGRESSIVE_CLUES,
    QuestionType.QUOTE,
    QuestionType.REORDERING,
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
                    <TableCell className="text-xs sm:text-sm 2xl:text-base" sx={{ color: teamData.color }}>
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
