import { UserRole } from '@/backend/models/users/User';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts';
import NaguiOptionFactory from '@/backend/models/questions/NaguiOptionFactory';

export default function NaguiPlayerOptionHelperText({ gameQuestion, lang = DEFAULT_LOCALE }) {
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
    return myRole === UserRole.ORGANIZER && <p>Loading player info...</p>;
  }
  if (!player) {
    return <p>Player not found</p>;
  }
  if (!team) {
    return <p>Team not found</p>;
  }

  return (
    <span>
      <span style={{ color: team.color }}>{player.name}</span> {HAS_CHOSEN_TEXT[lang]}{' '}
      {NaguiOptionFactory.createNaguiOption(gameQuestion.option).prependTypeWithEmoji(lang)}
    </span>
  );
}

const HAS_CHOSEN_TEXT = {
  en: 'has chosen',
  'fr-FR': 'a choisi',
};
