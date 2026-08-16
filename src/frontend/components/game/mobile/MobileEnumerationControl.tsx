import EnumerationController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationController';
import { useQuestionOnce } from '@/frontend/hooks/firestore/question/useBaseQuestionHooks';
import useGame from '@/frontend/hooks/useGame';
import { EnumerationQuestion } from '@/models/questions/enumeration';

export default function MobileEnumerationControl() {
  const game = useGame();

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useQuestionOnce(game?.currentQuestion as string);

  if (!game) return null;

  if (baseQuestionError || baseQuestionLoading || !baseQuestion) return null;

  return (
    <div className="h-full overflow-auto py-4">
      <EnumerationController baseQuestion={baseQuestion as EnumerationQuestion} />
    </div>
  );
}
