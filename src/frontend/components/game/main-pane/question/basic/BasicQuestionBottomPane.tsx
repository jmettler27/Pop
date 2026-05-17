import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';
import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import BasicQuestionOrganizerController from '@/frontend/components/game/main-pane/question/basic/BasicQuestionOrganizerController';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import { GameRounds } from '@/models/games/game';
import { GameBasicQuestion } from '@/models/questions/basic';
import { ParticipantRole } from '@/models/users/participant';

export default function BasicQuestionBottomPane() {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return <></>;
  const { chooserRepo } = gameRepositories;
  const { chooser, loading: chooserLoading, error: chooserError } = chooserRepo.useChooser();
  if (chooserError || chooserLoading || !chooser) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <BasicQuestionController />
      </div>
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooser as unknown as Chooser} />
      </div>
    </div>
  );
}

function BasicQuestionController() {
  const game = useGame();
  if (!game) return <></>;
  const myRole = useRole();

  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const gameQuestionRepo = new GameBasicQuestionRepository(game.id as string, currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (gameQuestionError || gameQuestionLoading || !gameQuestion) {
    return <></>;
  }

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <BasicQuestionOrganizerController gameQuestion={gameQuestion as GameBasicQuestion} />;
    default:
      return <BasicQuestionSpectatorController gameQuestion={gameQuestion as GameBasicQuestion} />;
  }
}

interface BasicQuestionSpectatorControllerProps {
  gameQuestion: GameBasicQuestion;
}

function BasicQuestionSpectatorController({ gameQuestion }: BasicQuestionSpectatorControllerProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={(gameQuestion as { teamId?: string }).teamId as string} />
      </span>
    </div>
  );
}
