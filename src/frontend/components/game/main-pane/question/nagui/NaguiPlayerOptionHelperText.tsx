'use client';

import { useIntl } from 'react-intl';

import { Spinner } from '@/frontend/components/ui/spinner';
import type { Locale } from '@/frontend/helpers/locales';
import { usePlayerOnce } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import { useTeamOnce } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameNaguiQuestion } from '@/models/questions/nagui';
import NaguiOptionFactory from '@/models/questions/NaguiOptionFactory';

const messages = defineMessages('frontend.game.bottom.NaguiPlayerOptionHelperText', {
  hasChosen: 'has chosen',
});

export default function NaguiPlayerOptionHelperText({ gameQuestion }: { gameQuestion: GameNaguiQuestion }) {
  const intl = useIntl();
  useRole();

  const gameId = useGameId();
  const { player, loading: playerLoading, error: playerError } = usePlayerOnce(gameId, gameQuestion.playerId ?? '');
  const { team, loading: teamLoading, error: teamError } = useTeamOnce(gameId, gameQuestion.teamId ?? '');

  if (playerError || teamError) {
    return <></>;
  }
  if (playerLoading || teamLoading) {
    return <Spinner />;
  }
  if (!player || !team) {
    return <></>;
  }

  const playerData = player as unknown as { name: string };
  const teamData = team as unknown as { color: string };

  return (
    <span>
      <span style={{ color: teamData.color }}>{playerData.name}</span> {intl.formatMessage(messages.hasChosen)}{' '}
      {NaguiOptionFactory.createNaguiOption(gameQuestion.option ?? '')?.prependTypeWithEmoji(intl.locale as Locale)}
    </span>
  );
}
