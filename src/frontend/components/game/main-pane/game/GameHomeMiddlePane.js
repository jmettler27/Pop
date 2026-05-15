import { useParams } from 'next/navigation';

import { Avatar, Divider, List, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { useIntl } from 'react-intl';

import { handleRoundSelected } from '@/backend/services/round/actions';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { RoundTypeIcon } from '@/frontend/helpers/question_types';
import { formatDuration, timestampElapsedSeconds, timestampToHour } from '@/frontend/helpers/time';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import { ParticipantRole } from '@/models/users/Participant';

const messages = defineMessages('frontend.game.middle.GameHomeMiddlePane', {
  title: 'Rounds',
  roundStarted: 'Started at {time} ({elapsed} ago)',
  roundEnded: 'Round ended at {time} ({duration})',
});

export default function GameHomeMiddlePane({}) {
  const intl = useIntl();
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="flex flex-col h-[10%] items-center justify-center">
        <h1 className="2xl:text-5xl font-bold">{intl.formatMessage(messages.title)}</h1>
      </div>
      <div className="flex flex-col h-[90%] w-full items-center justify-around overflow-auto">
        <GameHomeRounds />
      </div>
    </div>
  );
}

function GameHomeRounds() {
  const params = useParams();
  const gameId = params.id;

  const myRole = useRole();
  const myTeam = useTeam();
  const user = useUser();

  const [handleSelect, isHandling] = useAsyncAction(async (roundId, roundType) => {
    await handleRoundSelected(roundType, gameId, roundId, user.id);
  });

  const { roundRepo, chooserRepo } = useGameRepositories();
  const { rounds, loading: roundsLoading, error: roundsError } = roundRepo.useAllRounds();
  const { isChooser, loading: isChooserLoading, error: isChooserError } = chooserRepo.useIsChooser(myTeam);

  if (roundsError || isChooserError) {
    return <ErrorScreen inline />;
  }
  if (roundsLoading || isChooserLoading) {
    return <LoadingScreen inline />;
  }
  if (!rounds || isChooser === null) {
    return <></>;
  }

  const endedRounds = rounds.filter((r) => r.dateEnd !== null).map((r) => r.id);
  const activeRounds = rounds
    .filter((r) => r.order === null)
    .sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  const sortedEndedRounds = rounds.filter((r) => r.order !== null).sort((a, b) => a.order - b.order);

  const roundIsDisabled = (roundId) => {
    if (endedRounds.includes(roundId)) return true;
    if (myRole === ParticipantRole.ORGANIZER) return false;
    if (myRole === ParticipantRole.PLAYER) return !isChooser;
    return true;
  };

  /* Rounds */
  return (
    <>
      {activeRounds.length > 0 && (
        <List className="rounded-lg w-1/3" sx={{ bgcolor: 'background.paper' }}>
          {activeRounds.map((round, idx) => (
            <div key={round.id}>
              <GameHomeRoundItem
                round={round}
                isDisabled={isHandling || roundIsDisabled(round.id)}
                onSelectRound={() => handleSelect(round.id, round.type)}
              />
              {idx < activeRounds.length - 1 && <Divider variant="inset" component="li" />}
            </div>
          ))}
        </List>
      )}

      {sortedEndedRounds.length > 0 && (
        <List className="rounded-lg w-1/3" sx={{ bgcolor: 'background.paper' }}>
          {sortedEndedRounds.map((round, idx) => (
            <div key={round.id}>
              <GameHomeRoundItem
                round={round}
                isDisabled={isHandling || roundIsDisabled(round.id)}
                onSelectRound={() => handleSelect(round.id, round.type)}
              />
              {idx < sortedEndedRounds.length - 1 && <Divider variant="inset" component="li" />}
            </div>
          ))}
        </List>
      )}
    </>
  );
}

function GameHomeRoundItem({ round, isDisabled, onSelectRound }) {
  const intl = useIntl();
  const secondaryText = () => {
    if (!round.dateStart) return '';

    const startTime = timestampToHour(round.dateStart, intl.locale);

    if (!round.dateEnd) {
      const elapsed = formatDuration(timestampElapsedSeconds(round.dateStart), intl.locale);
      return intl.formatMessage(messages.roundStarted, { time: startTime, elapsed });
    }

    const endTime = timestampToHour(round.dateEnd, intl.locale);
    const duration = formatDuration(timestampElapsedSeconds(round.dateStart, round.dateEnd), intl.locale);
    return intl.formatMessage(messages.roundEnded, { time: endTime, duration });
  };

  return (
    <ListItemButton
      disabled={isDisabled}
      onClick={onSelectRound}
      sx={{
        '&.Mui-disabled': {
          opacity: 1,
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            bgcolor: round.dateEnd ? 'text.disabled' : 'primary.main',
            // opacity: isDisabled ? 0.5 : 1,
          }}
        >
          <RoundTypeIcon roundType={round.type} fontSize={30} />
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        sx={{
          color: round.dateEnd ? 'text.disabled' : 'text.primary',
          '& .MuiListItemText-primary': {
            // fontSize: '1.5rem',
            textDecoration: round.dateEnd ? 'line-through' : 'none',
            textDecorationThickness: '2px',
            // textDecorationColor: 'text.disabled',
          },
        }}
        primary={round.title}
        primaryTypographyProps={{
          className: '2xl:text-2xl',
        }}
        secondary={secondaryText()}
        secondaryTypographyProps={{
          className: 'text-lg',
        }}
      />
    </ListItemButton>
  );
}
