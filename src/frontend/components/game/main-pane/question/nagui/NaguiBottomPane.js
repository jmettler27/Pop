import { CircularProgress } from '@mui/material';

import GameNaguiQuestionRepository from '@/backend/repositories/question/GameNaguiQuestionRepository';
import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import NaguiOrganizerController from '@/frontend/components/game/main-pane/question/nagui/NaguiOrganizerController';
import NaguiPlayerController from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerController';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import { ParticipantRole } from '@/models/users/Participant';

export default function NaguiBottomPane({ question: baseQuestion }) {
  const { chooserRepo } = useGameRepositories();
  const { chooser, loading, error } = chooserRepo.useChooser();

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!chooser) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4">
        <NaguiController chooser={chooser} baseQuestion={baseQuestion} />
      </div>

      {/* Right part: list of buzzer players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooser} />
      </div>
    </div>
  );
}

function NaguiController({ chooser }) {
  const game = useGame();
  const myRole = useRole();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx];

  const gameQuestionRepo = new GameNaguiQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <NaguiOrganizerController gameQuestion={gameQuestion} />;
    case ParticipantRole.PLAYER:
      return <NaguiPlayerController chooserTeamId={chooserTeamId} gameQuestion={gameQuestion} />;
    default:
      return <NaguiSpectatorController chooserTeamId={chooserTeamId} gameQuestion={gameQuestion} />;
  }
}

function NaguiSpectatorController({ chooserTeamId, gameQuestion }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      {(gameQuestion.option === null) &
      (
        <span className="2xl:text-4xl font-bold">
          <GameChooserHelperText chooserTeamId={chooserTeamId} />
        </span>
      )}
      {gameQuestion.option !== null && (
        <span className="2xl:text-4xl font-bold">
          <NaguiPlayerOptionHelperText gameQuestion={gameQuestion} />
        </span>
      )}
    </div>
  );
}
