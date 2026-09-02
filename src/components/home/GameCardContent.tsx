import { useIntl } from 'react-intl';

import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/components/home/GameAvatars';
import globalMessages from '@/i18n/globalMessages';

interface GameCardContentProps {
  gameId: string;
}

export function GameOrganizersCardContent({ gameId }: GameCardContentProps) {
  const intl = useIntl();
  return (
    <div className="flex flex-row items-center justify-between pb-2 px-1">
      <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        {intl.formatMessage(globalMessages.organizers)}
      </p>
      <GameOrganizersAvatarGroup gameId={gameId} />
    </div>
  );
}

export function GamePlayersCardContent({ gameId }: GameCardContentProps) {
  const intl = useIntl();
  return (
    <div className="flex flex-row items-center justify-between pb-2 px-1">
      <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        {intl.formatMessage(globalMessages.players)}
      </p>
      <GamePlayersAvatarGroup gameId={gameId} />
    </div>
  );
}
