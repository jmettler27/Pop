import EnumerationChallengeController from '@/components/game/main-pane/question/enumeration/EnumerationChallengeController';
import EnumerationThinkingController from '@/components/game/main-pane/question/enumeration/EnumerationThinkingController';
import { Spinner } from '@/components/ui/spinner';
import { useQuestion } from '@/hooks/firestore/question/useGameQuestionHooks';
import { useTimer } from '@/hooks/firestore/timer/useTimerHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import { EnumerationQuestion, EnumerationQuestionStatus } from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';

export default function EnumerationController({ baseQuestion }: { baseQuestion: EnumerationQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const { timer, timerLoading, timerError } = useTimer(gameId);

  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = useQuestion(gameId, roundId, QuestionType.ENUMERATION, questionId);

  if (gameQuestionError || timerError) {
    return <></>;
  }
  if (gameQuestionLoading || timerLoading) {
    return <Spinner />;
  }
  if (!gameQuestion || !timer) {
    return <></>;
  }

  const gameQuestionStatus = (gameQuestion as unknown as { status?: string }).status;

  switch (gameQuestionStatus) {
    case EnumerationQuestionStatus.THINKING:
      return <EnumerationThinkingController baseQuestion={baseQuestion} timer={timer} />;
    case EnumerationQuestionStatus.CHALLENGE:
      return <EnumerationChallengeController />;
  }
}
