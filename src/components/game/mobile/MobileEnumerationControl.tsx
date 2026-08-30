import EnumerationController from '@/components/game/main-pane/question/enumeration/EnumerationController';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import { usePlayableQuestion } from '@/hooks/usePlayableQuestion';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';

export default function MobileEnumerationControl() {
  const { roundId, questionId } = useActiveQuestion()!;

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = usePlayableQuestion(
    roundId,
    QuestionType.ENUMERATION,
    questionId
  );

  if (baseQuestionError || baseQuestionLoading || !baseQuestion) return null;

  return (
    <div className="h-full overflow-auto py-4">
      <EnumerationController baseQuestion={baseQuestion as EnumerationQuestion} />
    </div>
  );
}
