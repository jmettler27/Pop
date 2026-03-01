import { ParticipantRole } from '@/backend/models/users/Participant';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts';
import NaguiOptionFactory from '@/backend/models/questions/NaguiOptionFactory';

const messages = defineMessages('frontend.game.bottom.NaguiPlayerOptionHelperText', {
  hasChosen: 'has chosen',
});

export default function NaguiPlayerOptionHelperText({ gameQuestion }) {
  const intl = useIntl();
  const myRole = useRoleContext();

  const { playerRepo, teamRepo } = useGameRepositoriesContext();
  const { player, playerLoading, playerError } = playerRepo.usePlayerOnce(gameQuestion.playerId);
  const { team, teamLoading, teamError } = teamRepo.useTeamOnce(gameQuestion.teamId);

  if (playerError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(playerError)}
      </p>
    );
  }
  if (teamError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(teamError)}
      </p>
    );
  }
  if (playerLoading || teamLoading) {
    return myRole === ParticipantRole.ORGANIZER && <p>Loading player info...</p>;
  }
  if (!player) {
    return <p>Player not found</p>;
  }
  if (!team) {
    return <p>Team not found</p>;
  }

  return (
    <span>
      <span style={{ color: team.color }}>{player.name}</span> {intl.formatMessage(messages.hasChosen)}{' '}
      {NaguiOptionFactory.createNaguiOption(gameQuestion.option).prependTypeWithEmoji(intl.locale)}
    </span>
  );
}
