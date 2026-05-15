'use client';

import { CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';

import type { Locale } from '@/frontend/helpers/locales';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
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

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo, teamRepo } = gameRepositories;
  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayerOnce(gameQuestion.playerId ?? '');
  const { team, loading: teamLoading, error: teamError } = teamRepo.useTeamOnce(gameQuestion.teamId ?? '');

  if (playerError || teamError) {
    return <></>;
  }
  if (playerLoading || teamLoading) {
    return <CircularProgress />;
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
