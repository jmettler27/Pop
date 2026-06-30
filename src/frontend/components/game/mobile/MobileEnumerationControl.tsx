import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import EnumerationController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationController';
import useGame from '@/frontend/hooks/useGame';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';

export default function MobileEnumerationControl() {
  const game = useGame();
  if (!game) return null;

  const baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(QuestionType.ENUMERATION);
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(
    game.currentQuestion as string
  );

  if (baseQuestionError || baseQuestionLoading || !baseQuestion) return null;

  return (
    <div className="h-full overflow-auto py-4">
      <EnumerationController baseQuestion={baseQuestion as EnumerationQuestion} />
    </div>
  );
}
