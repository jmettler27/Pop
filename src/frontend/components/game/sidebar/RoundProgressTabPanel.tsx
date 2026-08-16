'use client';

import { memo } from 'react';

import { useIntl } from 'react-intl';

import RoundQuestionsProgress from '@/frontend/components/game/sidebar/RoundQuestionsProgress';
import { Spinner } from '@/frontend/components/ui/spinner';
import { RoundTypeIcon } from '@/frontend/helpers/question-types';
import { useRound } from '@/frontend/hooks/firestore/round/useRoundHooks';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { type RoundType } from '@/models/rounds/round-type';

interface RoundProgressTabPanelProps {
  game: GameRounds;
}

export default function RoundProgressTabPanel({ game }: RoundProgressTabPanelProps) {
  const { round, loading: roundLoading, error: roundError } = useRound(game.id as string, game.currentRound as string);

  if (roundError) {
    return <></>;
  }
  if (roundLoading) {
    return <Spinner />;
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
  return (
    <div className="flex flex-row items-center w-full justify-center space-x-1 mt-1">
      <RoundTypeIcon roundType={roundType} className="size-5" />
      <span className="2xl:text-xl">
        <strong>
          {intl.formatMessage(globalMessages.round)} {roundOrder + 1}
        </strong>{' '}
        - <i>{roundTitle}</i>
      </span>
    </div>
  );
});
