'use client';

import { memo } from 'react';

import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Typography } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { rankingToEmoji } from '@/frontend/helpers/emojis';
import { RoundTypeIcon } from '@/frontend/helpers/question_types';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { AnyRound } from '@/models/rounds/RoundFactory';
import Team from '@/models/team';

export default function GlobalProgressTabPanel({ game }: { game: GameRounds }) {
  return (
    <div className="flex flex-col w-full items-center space-y-3">
      <GameRoundsProgressHeader gameTitle={game.title as string} />
      <GameRoundsProgress gameId={game.id as string} />
    </div>
  );
}

const GameRoundsProgressHeader = memo(function GameRoundsProgressHeader({ gameTitle }: { gameTitle: string }) {
  return <h1 className="2xl:text-xl font-bold mt-1 italic">{gameTitle}</h1>;
});

const GameRoundsProgress = memo(function GameRoundsProgress({ gameId }: { gameId: string }) {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo, roundRepo } = gameRepositories;

  const {
    rounds: startedRounds,
    loading: roundsLoading,
    error: roundsError,
  } = roundRepo.useAllRoundsOnce({
    where: { field: 'order', operator: '!=', value: null },
    orderBy: { field: 'order', direction: 'asc' },
  });
  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeamsOnce();

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

interface RoundSortedTeam {
  teams: string[];
  score: number;
}

interface RoundAccordionProps {
  gameId: string;
  round: AnyRound;
  teams: Team[];
  hasEnded: boolean;
  isCurrent: boolean;
}

function RoundAccordion({ gameId, round, teams, hasEnded, isCurrent }: RoundAccordionProps) {
  const intl = useIntl();
  const roundScoreRepo = new RoundScoreRepository(gameId, round.id as string);
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

  const roundSortedTeams = hasEnded
    ? ((roundScores as unknown as { roundSortedTeams: RoundSortedTeam[] }).roundSortedTeams ?? null)
    : null;
  console.log(round.title, hasEnded, roundSortedTeams);

  const borderColor = () => {
    if (hasEnded && roundSortedTeams != null && roundSortedTeams.length > 0) {
      const winnerTeams = roundSortedTeams[0].teams;
      if (winnerTeams) {
        const winnerTeam = teams.find((team) => team.id === winnerTeams[0]);
        return winnerTeam ? winnerTeam.color : 'inherit';
      }
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
          <RoundTypeIcon roundType={round.type!} fontSize={20} />
          <Typography className={clsx(isCurrent && !hasEnded && 'text-orange-300')}>
            <span className="2xl:text-xl">
              <strong>
                {intl.formatMessage(globalMessages.round)} {(round.order ?? 0) + 1}
              </strong>{' '}
              - <i>{round.title}</i>
            </span>
          </Typography>
        </div>
      </AccordionSummary>

      {hasEnded && roundSortedTeams && (
        <AccordionDetails>
          <ol className="list-inside">
            {roundSortedTeams.map((item: RoundSortedTeam, idx: number) => {
              const teamNames = teams.filter((team) => item.teams.includes(team.id as string)).map((team) => team.name);
              const teamNamesString = teamNames.join(', ');
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
