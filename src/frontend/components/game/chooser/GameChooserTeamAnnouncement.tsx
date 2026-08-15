import { type ReactNode } from 'react';

import { useIntl } from 'react-intl';

import fmt, { keyChunks } from '@/frontend/helpers/fmt';
import { useChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import { useTeamPlayers } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import { useTeam } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import useTeamContext from '@/frontend/hooks/useTeam';
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
  const game = useGame();
  const { chooser, loading: chooserLoading, error: chooserError } = useChooser(game?.id ?? null);
  if (!game) return null;

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
  const myTeam = useTeamContext();
  const myRole = useRole();
  const intl = useIntl();
  const { team, loading: teamLoading, error: teamError } = useTeam(game?.id ?? null, chooserTeamId);
  const { players, loading: playersLoading, error: playersError } = useTeamPlayers(game?.id ?? null, chooserTeamId);

  if (!game) return null;

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
