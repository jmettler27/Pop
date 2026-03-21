import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';

import { rankingToEmoji } from '@/frontend/helpers/emojis';
import { RoundTypeIcon } from '@/frontend/helpers/question_types';

import { memo } from 'react';

import globalMessages from '@/i18n/globalMessages';
import { useIntl } from 'react-intl';

import useGameRepositories from '@/frontend/hooks/useGameRepositories';

import LoadingScreen from '@/frontend/components/LoadingScreen';

import { Accordion, AccordionSummary, AccordionDetails, Typography, CircularProgress } from '@mui/material';

import clsx from 'clsx';

export default function GlobalProgressTabPanel({ game }) {
  return (
    <div className="flex flex-col w-full items-center space-y-3">
      <GameRoundsProgressHeader gameTitle={game.title} />
      <GameRoundsProgress gameId={game.id} />
    </div>
  );
}

const GameRoundsProgressHeader = memo(function GameRoundsProgressHeader({ gameTitle }) {
  return <h1 className="2xl:text-xl font-bold mt-1 italic">{gameTitle}</h1>;
});

const GameRoundsProgress = memo(function GameRoundsProgress({ gameId }) {
  const { teamRepo, roundRepo } = useGameRepositories();
  const { startedRounds, roundsLoading, roundsError } = roundRepo.useAllRoundsOnce({
    where: { field: 'order', operator: '!=', value: null },
    orderBy: { field: 'order', direction: 'asc' },
  });
  const { teams, teamsLoading, teamsError } = teamRepo.useAllTeamsOnce(gameId);

  if (roundsError || teamsError) {
    return <></>;
  }
  if (roundsLoading || teamsLoading) {
    return <LoadingScreen inline />;
  }
  if (!startedRounds || !teams) {
    return <></>;
  }

  return (
    <div className="w-full mt-4 px-2 space-y-2">
      {startedRounds.map((round, idx) => (
        <RoundAccordion
          key={idx}
          gameId={gameId}
          round={round}
          teams={teams}
          hasEnded={round.dateEnd !== null}
          isCurrent={idx === startedRounds.length - 1}
        />
      ))}
    </div>
  );
});

function RoundAccordion({ gameId, round, teams, hasEnded, isCurrent }) {
  const intl = useIntl();
  const roundScoreRepo = new RoundScoreRepository(gameId, round.id);
  const { roundScores, loading, error } = roundScoreRepo.useScoresOnce();

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!roundScores) {
    return <></>;
  }

  const roundSortedTeams = hasEnded ? roundScores.roundSortedTeams : null;
  console.log(round.title, hasEnded, roundSortedTeams);

  const borderColor = () => {
    if (hasEnded && roundSortedTeams != null && roundSortedTeams.length > 0) {
      const winnerTeams = roundSortedTeams[0].teams;
      if (winnerTeams) return teams.find((team) => team.id === winnerTeams[0]).color;
      return 'inherit';
    }
    if (isCurrent) return '#f97316';
  };

  return (
    <Accordion
      key={round.id}
      expanded={true}
      className="rounded-lg"
      elevation={0}
      sx={{
        borderWidth: '0.5px',
        borderStyle: 'solid',
        borderColor: borderColor(),
        backgroundColor: 'inherit',
        color: 'inherit',
      }}
      disableGutters
    >
      <AccordionSummary aria-controls="panel1a-content" id="panel1a-header">
        <div className="flex flex-row items-center w-full justify-center space-x-1">
          <RoundTypeIcon roundType={round.type} fontSize={20} />
          <Typography className={clsx(isCurrent && !hasEnded && 'text-orange-300')}>
            <span className="2xl:text-xl">
              <strong>
                {intl.formatMessage(globalMessages.round)} {round.order + 1}
              </strong>{' '}
              - <i>{round.title}</i>
            </span>
          </Typography>
        </div>
      </AccordionSummary>

      {hasEnded && (
        <AccordionDetails>
          <ol className="list-inside">
            {roundSortedTeams
              // .slice(0, round.rewards.length)
              .map((item, idx) => {
                const teamNames = teams.filter((team) => item.teams.includes(team.id)).map((team) => team.name);
                const teamNamesString = teamNames.slice(0, teamNames.length).join(', ');
                return (
                  <li key={idx} className={clsx(idx === 0 && 'font-bold', 'text-lg')}>
                    {rankingToEmoji(idx)} {teamNamesString} ({item.score} pt{item.score > 1 && 's'})
                  </li>
                );
              })}
          </ol>
        </AccordionDetails>
      )}
    </Accordion>
  );
}
