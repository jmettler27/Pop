import { togglePlayerAuthorization } from '@/backend/services/player/actions';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useParams } from 'next/navigation';

import { FormControlLabel, Switch } from '@mui/material';

const messages = defineMessages('frontend.game.bottom.AuthorizePlayersSwitch', {
  authorizeLabel: 'Authorize players',
});

export default function AuthorizePlayersSwitch({ authorized }) {
  const intl = useIntl();
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
      label={intl.formatMessage(messages.authorizeLabel)}
    />
  );
}
