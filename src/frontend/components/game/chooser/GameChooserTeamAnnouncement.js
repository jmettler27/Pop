import { useIntl } from 'react-intl';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { ParticipantRole } from '@/backend/models/users/Participant';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import defineMessages from '@/utils/defineMessages';
import fmt, { keyChunks } from '@/utils/fmt';

const messages = defineMessages('frontend.game.GameChooserTeamAnnouncement', {
  toPlay: 'play',
  toChoose: 'choose',
  chooserYourTeamTurn: "🫵 It's your team's turn to {action}",
  chooserYourTurn: "🫵 It's your turn to {action}",
  teamTurn: "It's Team <team>{teamName}</team>'s turn to {action}",
  playerTurn: "It's <team>{playerName}</team>'s turn to {action}",
});

export default function GameChooserTeamAnnouncement() {
  const { chooserRepo } = useGameRepositories();
  const { chooser, chooserLoading, chooserError } = chooserRepo.useChooser();

  if (chooserError || chooserLoading || !chooser) return null;

  const chooserTeamId = chooser.chooserOrder.length > 0 ? chooser.chooserOrder[chooser.chooserIdx] : null;

  return chooserTeamId ? <GameChooserHelperText chooserTeamId={chooserTeamId} /> : null;
}

function TeamColorSpan({ color, chunks }) {
  return <span style={{ color }}>{keyChunks(chunks)}</span>;
}

export function GameChooserHelperText({ chooserTeamId }) {
  const game = useGame();
  const myTeam = useTeam();
  const myRole = useRole();
  const intl = useIntl();
  const { teamRepo, playerRepo } = useGameRepositories();

  const { team, loading: teamLoading, error: teamError } = teamRepo.useTeam(chooserTeamId);
  const { players, loading: playersLoading, error: playersError } = playerRepo.useTeamPlayers(chooserTeamId);

  if (teamError || playersError || teamLoading || playersLoading || !team || !players) {
    return null;
  }

  const isChooser = myRole === ParticipantRole.PLAYER && chooserTeamId === myTeam;
  const teamHasManyPlayers = players.length > 1;
  const action =
    game.status === GameStatus.QUESTION_ACTIVE
      ? intl.formatMessage(messages.toPlay)
      : intl.formatMessage(messages.toChoose);
  const teamTag = (chunks) => <TeamColorSpan color={team.color} chunks={chunks} />;

  if (isChooser) {
    const msg = teamHasManyPlayers ? messages.chooserYourTeamTurn : messages.chooserYourTurn;
    return <span>{fmt(intl.formatMessage, msg, { action, team: teamTag })}</span>;
  }

  if (teamHasManyPlayers) {
    return <span>{fmt(intl.formatMessage, messages.teamTurn, { teamName: team.name, action, team: teamTag })}</span>;
  }

  return <span>{fmt(intl.formatMessage, messages.playerTurn, { playerName: team.name, action, team: teamTag })}</span>;
}
