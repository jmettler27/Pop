import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/frontend/components/home/GameAvatars';

import { Box, Typography } from '@mui/material';

export function GameOrganizersCardContent({ gameId, lang = DEFAULT_LOCALE }) {
  return (
    <Box className="flex flex-row items-center justify-between pb-2 px-1">
      <Typography variant="subtitle1" className="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        {ORGANIZERS[lang]}
      </Typography>
      <GameOrganizersAvatarGroup gameId={gameId} />
    </Box>
  );
}

export function GamePlayersCardContent({ gameId, lang = DEFAULT_LOCALE }) {
  return (
    <Box className="flex flex-row items-center justify-between pb-2 px-1">
      <Typography variant="subtitle1" className="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        {PLAYERS[lang]}
      </Typography>
      <GamePlayersAvatarGroup gameId={gameId} />
    </Box>
  );
}

const ORGANIZERS = {
  en: 'Organizers',
  'fr-FR': 'Organisateurs',
};

const PLAYERS = {
  en: 'Players',
  'fr-FR': 'Joueurs',
};
