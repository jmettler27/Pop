import GameChooserOrder from '@/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/components/game/main-pane/question/ResetQuestionButton';
import { Spinner } from '@/components/ui/spinner';
import { useQuestion } from '@/hooks/firestore/question/useGameQuestionHooks';
import { useChooser } from '@/hooks/firestore/user/useChooserHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useGameId from '@/hooks/useGameId';
import useRole from '@/hooks/useRole';
import { Chooser } from '@/models/chooser';
import { GameMCQQuestion, MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

interface MCQBottomPaneProps {
  baseQuestion: MCQQuestion;
}

export default function MCQBottomPane({ baseQuestion: _baseQuestion }: MCQBottomPaneProps) {
  const gameId = useGameId();
  const { chooser, loading, error } = useChooser(gameId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
  }
  if (!chooser) {
    return <></>;
  }

  const chooserData = chooser as unknown as Chooser;

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <MCQController chooser={chooserData} />
      </div>
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooser as unknown as Chooser} />
      </div>
    </div>
  );
}

interface MCQControllerProps {
  chooser: Chooser;
}

function MCQController({ chooser }: MCQControllerProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const role = useRole();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx] ?? '';

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.MCQ, questionId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  switch (role) {
    case ParticipantRole.ORGANIZER:
      return <MCQOrganizerController gameQuestion={gameQuestion as GameMCQQuestion} />;
    case ParticipantRole.PLAYER:
      return <MCQPlayerController chooserTeamId={chooserTeamId} />;
    default:
      return <MCQSpectatorController chooserTeamId={chooserTeamId} />;
  }
}

interface MCQOrganizerControllerProps {
  gameQuestion: GameMCQQuestion;
}

function MCQOrganizerController({ gameQuestion }: MCQOrganizerControllerProps) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={gameQuestion.teamId ?? ''} />
      </span>
      <div className="flex flex-row w-full justify-end">
        <ResetQuestionButton />
        <EndQuestionButton />
      </div>
    </div>
  );
}

interface MCQPlayerControllerProps {
  chooserTeamId: string;
}

function MCQPlayerController({ chooserTeamId }: MCQPlayerControllerProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}

interface MCQSpectatorControllerProps {
  chooserTeamId: string;
}

function MCQSpectatorController({ chooserTeamId }: MCQSpectatorControllerProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}
