import BuzzerPlayerController from '@/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import LabellingOrganizerController from '@/components/game/main-pane/question/labelling/LabellingOrganizerController';
import { useQuestionPlayers } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useRole from '@/hooks/useRole';
import { LabellingQuestion } from '@/models/questions/labelling';
import { ParticipantRole } from '@/models/users/participant';

interface QuestionPlayersData extends Record<string, unknown> {
  buzzed: string[];
}

export default function LabellingBottomPane({ baseQuestion }: { baseQuestion: LabellingQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const {
    data: questionPlayers,
    loading,
    error,
  } = useQuestionPlayers(gameId, roundId, questionId) as unknown as {
    data: QuestionPlayersData | null;
    loading: boolean;
    error: Error | undefined;
  };

  if (error || loading || !questionPlayers) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <LabellingController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

interface LabellingControllerProps {
  baseQuestion: LabellingQuestion;
  questionPlayers: QuestionPlayersData;
}

function LabellingController({ baseQuestion, questionPlayers }: LabellingControllerProps) {
  const role = useRole();

  switch (role) {
    case ParticipantRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case ParticipantRole.ORGANIZER:
      return <LabellingOrganizerController questionPlayers={questionPlayers} baseQuestion={baseQuestion} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
