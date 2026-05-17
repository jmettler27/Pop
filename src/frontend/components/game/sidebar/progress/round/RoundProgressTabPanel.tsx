'use client';

import { memo } from 'react';

import { CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';

import RoundQuestionsProgress from '@/frontend/components/game/sidebar/progress/round/RoundQuestionsProgress';
import { RoundTypeIcon } from '@/frontend/helpers/question_types';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { type RoundType } from '@/models/rounds/round-type';

interface RoundProgressTabPanelProps {
  game: GameRounds;
}

export default function RoundProgressTabPanel({ game }: RoundProgressTabPanelProps) {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { roundRepo } = gameRepositories;

  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound as string);

  if (roundError) {
    return <></>;
  }
  if (roundLoading) {
    return <CircularProgress />;
  }
  if (!round) {
    return <></>;
  }

  return (
    <div className="flex flex-col w-full items-center">
      <RoundProgressHeader
        roundType={round.type as RoundType}
        roundOrder={round.order ?? 0}
        roundTitle={round.title ?? ''}
      />
      <RoundQuestionsProgress game={game} round={round} />
    </div>
  );
}

interface RoundProgressHeaderProps {
  roundType: RoundType;
  roundOrder: number;
  roundTitle: string;
}

const RoundProgressHeader = memo(function RoundProgressHeader({
  roundType,
  roundOrder,
  roundTitle,
}: RoundProgressHeaderProps) {
  const intl = useIntl();
  console.log('RENDERED RoundProgressHeader');
  return (
    <div className="flex flex-row items-center w-full justify-center space-x-1 mt-1">
      <RoundTypeIcon roundType={roundType} fontSize={20} />
      <span className="2xl:text-xl">
        <strong>
          {intl.formatMessage(globalMessages.round)} {roundOrder + 1}
        </strong>{' '}
        - <i>{roundTitle}</i>
      </span>
    </div>
  );
});
