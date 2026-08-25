import BuzzerOrganizerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerOrganizerController';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import { useQuestionPlayers } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useRole from '@/frontend/hooks/useRole';
import { BuzzerQuestion } from '@/models/questions/buzzer';
import { ParticipantRole } from '@/models/users/participant';

interface BuzzerBottomPaneProps {
  baseQuestion: BuzzerQuestion;
}

export default function BuzzerBottomPane({ baseQuestion }: BuzzerBottomPaneProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { data: questionPlayers, loading, error } = useQuestionPlayers(gameId, roundId, questionId);

  if (error || loading || !questionPlayers) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <BuzzerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

interface BuzzerControllerProps {
  baseQuestion: BuzzerQuestion;
  questionPlayers: Record<string, unknown>;
}

function BuzzerController({ baseQuestion, questionPlayers }: BuzzerControllerProps) {
  const myRole = useRole();

  switch (myRole) {
    case ParticipantRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case ParticipantRole.ORGANIZER:
      return <BuzzerOrganizerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
