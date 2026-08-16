import EnumerationChallengeController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationChallengeController';
import EnumerationThinkingController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationThinkingController';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useTimer } from '@/frontend/hooks/firestore/timer/useTimerHooks';
import useGame from '@/frontend/hooks/useGame';
import { EnumerationQuestion, EnumerationQuestionStatus } from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';

export default function EnumerationController({ baseQuestion }: { baseQuestion: EnumerationQuestion }) {
  const game = useGame();
  const { timer, timerLoading, timerError } = useTimer(game?.id ?? null);

  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = useQuestion(
    game?.id ?? null,
    (game?.currentRound as string | undefined) ?? null,
    QuestionType.ENUMERATION,
    game?.currentQuestion as string
  );

  if (!game) return null;

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
