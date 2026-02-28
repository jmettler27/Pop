import { RoundType } from '@/backend/models/rounds/RoundType';
import { RoundTypeIcon } from '@/backend/utils/rounds';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.sidebar.progress.round.RoundProgressTabPanel', {
  round: 'Round',
});

import { useGameRepositoriesContext } from '@/frontend/contexts';

import SpecialRoundProgress from '@/frontend/components/game/sidebar/progress/round/SpecialRoundProgress';
import RoundQuestionsProgress from '@/frontend/components/game/sidebar/progress/round/RoundQuestionsProgress';

import { memo } from 'react';

import { CircularProgress } from '@mui/material';

export default function RoundProgressTabPanel({ game }) {
  const { roundRepo } = useGameRepositoriesContext();
  const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound);

  if (roundError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundError)}</strong>
      </p>
    );
  }
  if (roundLoading) {
    return <CircularProgress />;
  }
  if (!round) {
    return <></>;
  }

  return (
    <div className="flex flex-col w-full items-center">
      <RoundProgressHeader roundType={round.type} roundOrder={round.order} roundTitle={round.title} />
      {round.type == RoundType.SPECIAL ? (
        <SpecialRoundProgress game={game} round={round} />
      ) : (
        <RoundQuestionsProgress game={game} round={round} />
      )}
    </div>
  );
}

const RoundProgressHeader = memo(function RoundProgressHeader({ roundType, roundOrder, roundTitle }) {
  const intl = useIntl();
  console.log('RENDERED RoundProgressHeader');
  return (
    <div className="flex flex-row items-center w-full justify-center space-x-1 mt-1">
      <RoundTypeIcon roundType={roundType} fontSize={20} />
      <span className="2xl:text-xl">
        <strong>
          {intl.formatMessage(messages.round)} {roundOrder + 1}
        </strong>{' '}
        - <i>{roundTitle}</i>
      </span>
    </div>
  );
});
