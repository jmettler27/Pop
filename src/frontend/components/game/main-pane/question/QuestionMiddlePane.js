import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import BasicMiddlePane from '@/frontend/components/game/main-pane/question/basic/BasicMiddlePane';
import BuzzerMiddlePane from '@/frontend/components/game/main-pane/question/buzzer/BuzzerMiddlePane';
import EnumerationMiddlePane from '@/frontend/components/game/main-pane/question/enumeration/EnumerationMiddlePane';
import LabellingMiddlePane from '@/frontend/components/game/main-pane/question/labelling/LabellingMiddlePane';
import MatchingMiddlePane from '@/frontend/components/game/main-pane/question/matching/MatchingMiddlePane';
import MCQMiddlePane from '@/frontend/components/game/main-pane/question/mcq/MCQMiddlePane';
import NaguiMiddlePane from '@/frontend/components/game/main-pane/question/nagui/NaguiMiddlePane';
import OddOneOutMiddlePane from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutMiddlePane';
import QuoteMiddlePane from '@/frontend/components/game/main-pane/question/quote/QuoteMiddlePane';
import ReorderingMiddlePane from '@/frontend/components/game/main-pane/question/reordering/ReorderingMiddlePane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';

export default function QuestionMiddlePane() {
  const game = useGame();

  const baseQuestionRepo = new BaseQuestionRepository();
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(
    game.currentQuestion
  );

  if (baseQuestionError) {
    return <ErrorScreen inline />;
  }
  if (baseQuestionLoading) {
    return <LoadingScreen inline />;
  }
  if (!baseQuestion) {
    return <></>;
  }

  switch (baseQuestion.type) {
    case QuestionType.BASIC:
      return <BasicMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.BLINDTEST:
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.PROGRESSIVE_CLUES:
      return <BuzzerMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.ENUMERATION:
      return <EnumerationMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.LABELLING:
      return <LabellingMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.MATCHING:
      return <MatchingMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.MCQ:
      return <MCQMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.NAGUI:
      return <NaguiMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.ODD_ONE_OUT:
      return <OddOneOutMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.QUOTE:
      return <QuoteMiddlePane baseQuestion={baseQuestion} />;
    case QuestionType.REORDERING:
      return <ReorderingMiddlePane baseQuestion={baseQuestion} />;
  }
}
