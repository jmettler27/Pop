import { useIntl } from 'react-intl';

import { togglePlayerAuthorization } from '@/backend/services/player/actions';
import { Switch } from '@/frontend/components/ui/switch';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameId from '@/frontend/hooks/useGameId';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.AuthorizePlayersSwitch', {
  authorizeLabel: 'Authorize players',
});

interface AuthorizePlayersSwitchProps {
  authorized: boolean;
}

export default function AuthorizePlayersSwitch({ authorized }: AuthorizePlayersSwitchProps) {
  const intl = useIntl();
  const gameId = useGameId();

  const [handleAuthorizePlayers, isAuthorizing] = useAsyncAction(async () => {
    await togglePlayerAuthorization(gameId as string);
  });

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <Switch
        checked={authorized}
        onCheckedChange={handleAuthorizePlayers}
        disabled={isAuthorizing}
        aria-label="controlled"
      />
      <span className="text-sm">{intl.formatMessage(messages.authorizeLabel)}</span>
    </label>
  );
}
