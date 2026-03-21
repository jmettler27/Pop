import { ParticipantRole } from '@/backend/models/users/Participant';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';

import NaguiOptionFactory from '@/backend/models/questions/NaguiOptionFactory';
import { CircularProgress } from '@mui/material';

const messages = defineMessages('frontend.game.bottom.NaguiPlayerOptionHelperText', {
  hasChosen: 'has chosen',
});

export default function NaguiPlayerOptionHelperText({ gameQuestion }) {
  const intl = useIntl();
  const myRole = useRole();

  const { playerRepo, teamRepo } = useGameRepositories();
  const { player, playerLoading, playerError } = playerRepo.usePlayerOnce(gameQuestion.playerId);
  const { team, teamLoading, teamError } = teamRepo.useTeamOnce(gameQuestion.teamId);

  if (playerError || teamError) {
    return <></>;
  }
  if (playerLoading || teamLoading) {
    return <CircularProgress />;
  }
  if (!player || !team) {
    return <></>;
  }

  return (
    <span>
      <span style={{ color: team.color }}>{player.name}</span> {intl.formatMessage(messages.hasChosen)}{' '}
      {NaguiOptionFactory.createNaguiOption(gameQuestion.option).prependTypeWithEmoji(intl.locale)}
    </span>
  );
}
