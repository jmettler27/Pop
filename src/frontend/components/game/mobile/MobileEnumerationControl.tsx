import EnumerationController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationController';
import { useQuestionOnce } from '@/frontend/hooks/firestore/question/useBaseQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import { EnumerationQuestion } from '@/models/questions/enumeration';

export default function MobileEnumerationControl() {
  const { questionId } = useActiveQuestion()!;

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useQuestionOnce(questionId);

  if (baseQuestionError || baseQuestionLoading || !baseQuestion) return null;

  return (
    <div className="h-full overflow-auto py-4">
      <EnumerationController baseQuestion={baseQuestion as EnumerationQuestion} />
    </div>
  );
}
