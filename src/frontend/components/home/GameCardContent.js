import { Box, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/frontend/components/home/GameAvatars';
import globalMessages from '@/frontend/i18n/globalMessages';

export function GameOrganizersCardContent({ gameId }) {
  const intl = useIntl();
  return (
    <Box className="flex flex-row items-center justify-between pb-2 px-1">
      <Typography variant="subtitle1" className="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        {intl.formatMessage(globalMessages.organizers)}
      </Typography>
      <GameOrganizersAvatarGroup gameId={gameId} />
    </Box>
  );
}

export function GamePlayersCardContent({ gameId }) {
  const intl = useIntl();
  return (
    <Box className="flex flex-row items-center justify-between pb-2 px-1">
      <Typography variant="subtitle1" className="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        {intl.formatMessage(globalMessages.players)}
      </Typography>
      <GamePlayersAvatarGroup gameId={gameId} />
    </Box>
  );
}
