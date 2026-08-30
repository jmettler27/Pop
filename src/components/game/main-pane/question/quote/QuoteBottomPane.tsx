'use client';

import BuzzerPlayerController from '@/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import QuoteOrganizerController from '@/components/game/main-pane/question/quote/QuoteOrganizerController';
import { Spinner } from '@/components/ui/spinner';
import { useQuestionPlayers } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useRole from '@/hooks/useRole';
import { QuoteQuestion } from '@/models/questions/quote';
import { ParticipantRole } from '@/models/users/participant';

export default function QuoteBottomPane({ baseQuestion }: { baseQuestion: QuoteQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { data: questionPlayers, loading, error } = useQuestionPlayers(gameId, roundId, questionId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
  }
  if (!questionPlayers) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <QuoteController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

function QuoteController({
  baseQuestion,
  questionPlayers,
}: {
  baseQuestion: QuoteQuestion;
  questionPlayers: Record<string, unknown>;
}) {
  const role = useRole();

  switch (role) {
    case ParticipantRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case ParticipantRole.ORGANIZER:
      return <QuoteOrganizerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
