import { ParticipantRole } from '@/backend/models/users/Participant';

import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';

import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import BasicQuestionOrganizerController from '@/frontend/components/game/main-pane/question/basic/BasicQuestionOrganizerController';

import { CircularProgress } from '@mui/material';
import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';

export default function BasicQuestionBottomPane({}) {
  const { chooserRepo } = useGameRepositories();
  const { chooser, chooserLoading, chooserError } = chooserRepo.useChooser();
  if (chooserError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(chooserError)}</strong>
      </p>
    );
  }
  if (chooserLoading) {
    return <CircularProgress />;
  }
  if (!chooser) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <BasicQuestionController />
      </div>
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooser} />
      </div>
    </div>
  );
}

function BasicQuestionController({}) {
  const game = useGame();
  const myRole = useRole();

  const gameQuestionRepo = new GameBasicQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useDocument(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <CircularProgress />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <BasicQuestionOrganizerController gameQuestion={gameQuestion} />;
    default:
      return <BasicQuestionSpectatorController gameQuestion={gameQuestion} />;
  }
}

function BasicQuestionSpectatorController({ gameQuestion }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={gameQuestion.teamId} />
      </span>
    </div>
  );
}
