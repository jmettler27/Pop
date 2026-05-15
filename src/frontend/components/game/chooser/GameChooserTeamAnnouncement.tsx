import { type ReactNode } from 'react';

import { useIntl } from 'react-intl';

import fmt, { keyChunks } from '@/frontend/helpers/fmt';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameStatus } from '@/models/games/game-status';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.GameChooserTeamAnnouncement', {
  toPlay: 'play',
  toChoose: 'choose',
  chooserYourTeamTurn: "🫵 It's your team's turn to {action}",
  chooserYourTurn: "🫵 It's your turn to {action}",
  teamTurn: "It's Team <team>{teamName}</team>'s turn to {action}",
  playerTurn: "It's <team>{playerName}</team>'s turn to {action}",
});

export default function GameChooserTeamAnnouncement() {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { chooserRepo } = gameRepositories;
  const { chooser, loading: chooserLoading, error: chooserError } = chooserRepo.useChooser();

  if (chooserError || chooserLoading || !chooser) return null;

  const chooserTeamId =
    (chooser.chooserOrder as string[]).length > 0
      ? (chooser.chooserOrder as string[])[chooser.chooserIdx as number]
      : null;

  return chooserTeamId ? <GameChooserHelperText chooserTeamId={chooserTeamId} /> : null;
}

interface TeamColorSpanProps {
  color: string;
  chunks: ReactNode[];
}

function TeamColorSpan({ color, chunks }: TeamColorSpanProps) {
  return <span style={{ color }}>{keyChunks(chunks)}</span>;
}

interface GameChooserHelperTextProps {
  chooserTeamId: string;
}

export function GameChooserHelperText({ chooserTeamId }: GameChooserHelperTextProps) {
  const game = useGame();
  if (!game) return null;
  const myTeam = useTeam();
  const myRole = useRole();
  const intl = useIntl();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo, playerRepo } = gameRepositories;

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
  const teamTag = (chunks: ReactNode[]) => <TeamColorSpan color={team.color} chunks={chunks} />;

  if (isChooser) {
    const msg = teamHasManyPlayers ? messages.chooserYourTeamTurn : messages.chooserYourTurn;
    return <span>{fmt(intl.formatMessage, msg, { action, team: teamTag })}</span>;
  }

  if (teamHasManyPlayers) {
    return <span>{fmt(intl.formatMessage, messages.teamTurn, { teamName: team.name, action, team: teamTag })}</span>;
  }

  return <span>{fmt(intl.formatMessage, messages.playerTurn, { playerName: team.name, action, team: teamTag })}</span>;
}
