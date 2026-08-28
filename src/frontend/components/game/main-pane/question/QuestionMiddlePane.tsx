import ErrorScreen from '@/frontend/components/ErrorScreen';
import BasicMiddlePane from '@/frontend/components/game/main-pane/question/basic/BasicMiddlePane';
import BuzzerMiddlePane from '@/frontend/components/game/main-pane/question/buzzer/BuzzerMiddlePane';
import EnumerationMiddlePane from '@/frontend/components/game/main-pane/question/enumeration/EnumerationMiddlePane';
import EstimationMiddlePane from '@/frontend/components/game/main-pane/question/estimation/EstimationMiddlePane';
import LabellingMiddlePane from '@/frontend/components/game/main-pane/question/labelling/LabellingMiddlePane';
import MatchingMiddlePane from '@/frontend/components/game/main-pane/question/matching/MatchingMiddlePane';
import MCQMiddlePane from '@/frontend/components/game/main-pane/question/mcq/MCQMiddlePane';
import NaguiMiddlePane from '@/frontend/components/game/main-pane/question/nagui/NaguiMiddlePane';
import OddOneOutMiddlePane from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutMiddlePane';
import QuoteMiddlePane from '@/frontend/components/game/main-pane/question/quote/QuoteMiddlePane';
import ReorderingMiddlePane from '@/frontend/components/game/main-pane/question/reordering/ReorderingMiddlePane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { ActiveQuestionProvider } from '@/frontend/contexts/ActiveQuestionContext';
import useGame from '@/frontend/hooks/useGame';
import { usePlayableQuestion } from '@/frontend/hooks/usePlayableQuestion';
import type { BasicQuestion } from '@/models/questions/basic';
import type { BuzzerQuestion } from '@/models/questions/buzzer';
import type { EnumerationQuestion } from '@/models/questions/enumeration';
import type { EstimationQuestion } from '@/models/questions/estimation';
import type { LabellingQuestion } from '@/models/questions/labelling';
import type { MatchingQuestion } from '@/models/questions/matching';
import type { MCQQuestion } from '@/models/questions/mcq';
import type { NaguiQuestion } from '@/models/questions/nagui';
import type { OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { QuestionType } from '@/models/questions/question-type';
import { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';
import type { QuoteQuestion } from '@/models/questions/quote';
import type { ReorderingQuestion } from '@/models/questions/reordering';

export default function QuestionMiddlePane() {
  const game = useGame();

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = usePlayableQuestion(
    game?.currentRound as string | undefined,
    game?.currentQuestionType as QuestionType | undefined,
    game?.currentQuestion as string | undefined
  );

  if (!game) return null;
  if (baseQuestionError) return <ErrorScreen inline />;
  if (baseQuestionLoading) return <LoadingScreen inline />;
  if (!baseQuestion) return null;

  return (
    <ActiveQuestionProvider
      gameId={game.id as string}
      roundId={game.currentRound as string}
      questionId={game.currentQuestion as string}
      questionType={game.currentQuestionType as QuestionType}
    >
      <SelectedQuestionMiddlePane baseQuestion={baseQuestion} />
    </ActiveQuestionProvider>
  );
}

function SelectedQuestionMiddlePane({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) {
  switch (baseQuestion.type) {
    case QuestionType.BASIC:
      return <BasicMiddlePane baseQuestion={baseQuestion as BasicQuestion} />;
    case QuestionType.BLINDTEST:
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.PROGRESSIVE_CLUES:
      return <BuzzerMiddlePane baseQuestion={baseQuestion as BuzzerQuestion} />;
    case QuestionType.ENUMERATION:
      return <EnumerationMiddlePane baseQuestion={baseQuestion as EnumerationQuestion} />;
    case QuestionType.ESTIMATION:
      return <EstimationMiddlePane baseQuestion={baseQuestion as EstimationQuestion} />;
    case QuestionType.LABELLING:
      return <LabellingMiddlePane baseQuestion={baseQuestion as LabellingQuestion} />;
    case QuestionType.MATCHING:
      return <MatchingMiddlePane baseQuestion={baseQuestion as MatchingQuestion} />;
    case QuestionType.MCQ:
      return <MCQMiddlePane baseQuestion={baseQuestion as MCQQuestion} />;
    case QuestionType.NAGUI:
      return <NaguiMiddlePane baseQuestion={baseQuestion as NaguiQuestion} />;
    case QuestionType.ODD_ONE_OUT:
      return <OddOneOutMiddlePane baseQuestion={baseQuestion as OddOneOutQuestion} />;
    case QuestionType.QUOTE:
      return <QuoteMiddlePane baseQuestion={baseQuestion as QuoteQuestion} />;
    case QuestionType.REORDERING:
      return <ReorderingMiddlePane baseQuestion={baseQuestion as ReorderingQuestion} />;
    default:
      return null;
  }
}
