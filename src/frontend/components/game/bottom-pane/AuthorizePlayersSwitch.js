import { togglePlayerAuthorization } from '@/backend/services/player/actions';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useParams } from 'next/navigation';

import { FormControlLabel, Switch } from '@mui/material';

export default function AuthorizePlayersSwitch({ authorized, lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();

  const [handleAuthorizePlayers, isAuthorizing] = useAsyncAction(async () => {
    await togglePlayerAuthorization(gameId);
  });

  return (
    <FormControlLabel
      control={
        <Switch
          checked={authorized}
          onChange={handleAuthorizePlayers}
          disabled={isAuthorizing}
          inputProps={{ 'aria-label': 'controlled' }}
        />
      }
      label={AUTHORIZE_PLAYERS_SWITCH_LABEL[lang]}
    />
  );
}

const AUTHORIZE_PLAYERS_SWITCH_LABEL = {
  en: 'Authorize players',
  'fr-FR': 'Autoriser les joueurs',
};
