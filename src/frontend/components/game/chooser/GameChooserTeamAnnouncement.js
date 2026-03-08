import { GameStatus } from '@/backend/models/games/GameStatus';
import { ParticipantRole } from '@/backend/models/users/Participant';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.GameChooserTeamAnnouncement', {
  toPlay: 'play',
  toChoose: 'choose',
});

import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';

export default function GameChooserTeamAnnouncement({}) {
  const game = useGame();

  const { chooserRepo } = useGameRepositories();
  const { chooser, chooserLoading, chooserError } = chooserRepo.useChooser();

  if (chooserError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(chooserError)}
      </p>
    );
  }
  if (chooserLoading) {
    return <></>;
  }
  if (!chooser) {
    return <></>;
  }

  const chooserTeamId = chooser.chooserOrder.length > 0 ? chooser.chooserOrder[chooser.chooserIdx] : null;
  return chooserTeamId && <GameChooserHelperText chooserTeamId={chooserTeamId} />;
}

export function GameChooserHelperText({ chooserTeamId }) {
  const game = useGame();
  const myTeam = useTeam();
  const myRole = useRole();
  const intl = useIntl();

  const { teamRepo, playerRepo, chooserRepo } = useGameRepositories();

  const { team, loading: teamLoading, error: teamError } = teamRepo.useTeam(chooserTeamId);
  const { players, loading: playersLoading, error: playersError } = playerRepo.useTeamPlayers(chooserTeamId);

  if (teamError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(teamError)}</strong>
      </p>
    );
  }
  if (playersError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(playersError)}</strong>
      </p>
    );
  }
  if (teamLoading || playersLoading) {
    return <></>;
  }
  if (!team || !players) {
    return <></>;
  }

  const isChooser = myRole === ParticipantRole.PLAYER && chooserTeamId === myTeam;
  const teamHasManyPlayers = players.length > 1;
  const chooserActionText = chooserAction(game.status, intl);

  if (isChooser) {
    if (intl.locale === 'fr')
      return (
        <span>
          🫵 C&apos;est à <span style={{ color: team.color }}>{teamHasManyPlayers ? 'ton équipe' : 'toi'}</span> de{' '}
          {chooserActionText}{' '}
        </span>
      );
    return <span>🫵 It&apos;s your turn to {chooserActionText}</span>;
  }
  if (teamHasManyPlayers) {
    if (intl.locale === 'fr')
      return (
        <span>
          C&apos;est à l&apos;équipe <span style={{ color: team.color }}>{team.name}</span> de {chooserActionText}
        </span>
      );
    return (
      <span>
        It&apos;s Team <span style={{ color: team.color }}>{team.name}</span>&apos;s turn to {chooserActionText}
      </span>
    );
  }
  const chooserPlayerName = team.name;
  if (intl.locale === 'fr')
    return (
      <span>
        C&apos;est à <span style={{ color: team.color }}>{chooserPlayerName}</span> de {chooserActionText}
      </span>
    );
  return (
    <span>
      It&apos;s <span style={{ color: team.color }}>{chooserPlayerName}</span>&apos;s turn to {chooserActionText}
    </span>
  );
}

const chooserAction = (gameStatus, intl) => {
  return gameStatus === GameStatus.QUESTION_ACTIVE
    ? intl.formatMessage(messages.toPlay)
    : intl.formatMessage(messages.toChoose);
};
