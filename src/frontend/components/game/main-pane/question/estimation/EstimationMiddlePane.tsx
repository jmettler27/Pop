'use client';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import EstimationOrganizerPane from '@/frontend/components/game/main-pane/question/estimation/EstimationOrganizerPane';
import EstimationPlayerPane from '@/frontend/components/game/main-pane/question/estimation/EstimationPlayerPane';
import EstimationSpectatorPane from '@/frontend/components/game/main-pane/question/estimation/EstimationSpectatorPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useRole from '@/frontend/hooks/useRole';
import { EstimationQuestion, GameEstimationQuestion } from '@/models/questions/estimation';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

export default function EstimationMiddlePane({ baseQuestion }: { baseQuestion: EstimationQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const role = useRole();

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.ESTIMATION, questionId);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const gameQuestionData = gameQuestion as unknown as GameEstimationQuestion;

  switch (role) {
    case ParticipantRole.ORGANIZER:
      return <EstimationOrganizerPane baseQuestion={baseQuestion} gameQuestion={gameQuestionData} />;
    case ParticipantRole.PLAYER:
      return <EstimationPlayerPane baseQuestion={baseQuestion} gameQuestion={gameQuestionData} />;
    case ParticipantRole.SPECTATOR:
      return <EstimationSpectatorPane baseQuestion={baseQuestion} gameQuestion={gameQuestionData} />;
    default:
      return <></>;
  }
}
