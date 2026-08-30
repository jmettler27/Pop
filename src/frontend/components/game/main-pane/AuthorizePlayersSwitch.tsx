import { useIntl } from 'react-intl';

import { updatePlayer } from '@/frontend/api';
import { Switch } from '@/frontend/components/ui/switch';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameId from '@/frontend/hooks/useGameId';
import useUserId from '@/frontend/hooks/useUserId';
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
  const userId = useUserId();

  const [handleAuthorizePlayers, isAuthorizing] = useAsyncAction(async () => {
    // `toggle_authorization` is game-scoped; the Go handler ignores the {playerId} path segment.
    await updatePlayer(gameId as string, userId as string, { action: 'toggle_authorization' });
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
