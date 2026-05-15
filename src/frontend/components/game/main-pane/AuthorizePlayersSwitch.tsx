import { useParams } from 'next/navigation';

import { FormControlLabel, Switch } from '@mui/material';
import { useIntl } from 'react-intl';

import { togglePlayerAuthorization } from '@/backend/services/player/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.AuthorizePlayersSwitch', {
  authorizeLabel: 'Authorize players',
});

interface AuthorizePlayersSwitchProps {
  authorized: boolean;
}

export default function AuthorizePlayersSwitch({ authorized }: AuthorizePlayersSwitchProps) {
  const intl = useIntl();
  const { id } = useParams();
  const gameId = id as string;

  const [handleAuthorizePlayers, isAuthorizing] = useAsyncAction(async () => {
    await togglePlayerAuthorization(gameId as string);
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
      label={intl.formatMessage(messages.authorizeLabel)}
    />
  );
}
