import { Avatar, Stack } from '@mui/material';
import { useIntl } from 'react-intl';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.middlePane.GameStartMiddlePane', {
  intro: 'This humorous and interactive program is brought to you by',
});

export default function GameStartMiddlePane() {
  const game = useGame();
  if (!game) return null;
  const intl = useIntl();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { organizerRepo } = gameRepositories;
  const {
    organizers,
    loading: organizersLoading,
    error: organizersError,
  } = organizerRepo.useAllOrganizerIdentitiesOnce();

  if (organizersLoading) return <LoadingScreen inline />;
  if (organizersError) return <ErrorScreen inline />;

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="flex flex-col h-1/6 items-center justify-center overflow-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-bold text-yellow-300 italic px-2">
          {game.title}
        </h1>
      </div>
      <div className="flex flex-col h-5/6 w-full items-center justify-center space-y-4 overflow-auto">
        <span className="text-xs sm:text-sm 2xl:text-base 2xl:text-xl">{intl.formatMessage(messages.intro)}</span>

        <Stack direction="row" spacing={3} className="h-1/3">
          {organizers.map((o: { id: unknown; name: unknown }) => (
            <OrganizerItem key={o.id as string} organizer={o} />
          ))}
        </Stack>
      </div>
    </div>
  );
}

interface OrganizerItemProps {
  organizer: { id: unknown; name: unknown };
}

function OrganizerItem({ organizer }: OrganizerItemProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <span className="text-lg sm:text-xl lg:text-2xl 2xl:text-3xl font-bold">{organizer.name as string}</span>
      <Avatar alt={organizer.name as string} src={undefined} sx={{ width: 'auto', height: '50%' }} />
    </div>
  );
}
