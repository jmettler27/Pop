import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import BasicQuestionOrganizerController from '@/frontend/components/game/main-pane/question/basic/BasicQuestionOrganizerController';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useGame from '@/frontend/hooks/useGame';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import { Chooser } from '@/models/chooser';
import { GameRounds } from '@/models/games/game';
import { GameBasicQuestion } from '@/models/questions/basic';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

export default function BasicQuestionBottomPane() {
  const gameId = useGameId();
  const { chooser, loading: chooserLoading, error: chooserError } = useChooser(gameId);
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
  const myRole = useRole();

  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = useQuestion(
    game?.id ?? null,
    (currentRound as string | undefined) ?? null,
    QuestionType.BASIC,
    game?.currentQuestion as string
  );

  if (!game) return <></>;

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
  const chooserTeamId = gameQuestion.winner?.teamId;
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        {chooserTeamId && <GameChooserHelperText chooserTeamId={chooserTeamId} />}
      </span>
    </div>
  );
}
