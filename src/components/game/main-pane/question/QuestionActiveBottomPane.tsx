'use client';

import BasicQuestionBottomPane from '@/components/game/main-pane/question/basic/BasicQuestionBottomPane';
import BuzzerBottomPane from '@/components/game/main-pane/question/buzzer/BuzzerBottomPane';
import EnumerationBottomPane from '@/components/game/main-pane/question/enumeration/EnumerationBottomPane';
import EstimationBottomPane from '@/components/game/main-pane/question/estimation/EstimationBottomPane';
import LabellingBottomPane from '@/components/game/main-pane/question/labelling/LabellingBottomPane';
import MatchingBottomPane from '@/components/game/main-pane/question/matching/MatchingBottomPane';
import MCQBottomPane from '@/components/game/main-pane/question/mcq/MCQBottomPane';
import NaguiBottomPane from '@/components/game/main-pane/question/nagui/NaguiBottomPane';
import OddOneOutBottomPane from '@/components/game/main-pane/question/odd-one-out/OddOneOutBottomPane';
import QuoteBottomPane from '@/components/game/main-pane/question/quote/QuoteBottomPane';
import ReorderingBottomPane from '@/components/game/main-pane/question/reordering/ReorderingBottomPane';
import { Spinner } from '@/components/ui/spinner';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import { usePlayableQuestion } from '@/hooks/usePlayableQuestion';
import { QuestionType } from '@/models/questions/question-type';

export default function QuestionActiveBottomPane() {
  const { roundId, questionId, questionType } = useActiveQuestion()!;

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = usePlayableQuestion(
    roundId,
    questionType,
    questionId
  );

  if (baseQuestionError) return null;
  if (baseQuestionLoading) return <Spinner />;
  if (!baseQuestion) return null;

  switch (baseQuestion.type) {
    case QuestionType.PROGRESSIVE_CLUES:
    case QuestionType.IMAGE:
    case QuestionType.BLINDTEST:
    case QuestionType.EMOJI:
      return <BuzzerBottomPane baseQuestion={baseQuestion as never} />;
    case QuestionType.QUOTE:
      return <QuoteBottomPane baseQuestion={baseQuestion as never} />;
    case QuestionType.LABELLING:
      return <LabellingBottomPane baseQuestion={baseQuestion as never} />;
    case QuestionType.ENUMERATION:
      return <EnumerationBottomPane baseQuestion={baseQuestion as never} />;
    case QuestionType.ESTIMATION:
      return <EstimationBottomPane baseQuestion={baseQuestion as never} />;
    case QuestionType.ODD_ONE_OUT:
      return <OddOneOutBottomPane />;
    case QuestionType.MATCHING:
      return <MatchingBottomPane />;
    case QuestionType.MCQ:
      return <MCQBottomPane baseQuestion={baseQuestion as never} />;
    case QuestionType.NAGUI:
      return <NaguiBottomPane />;
    case QuestionType.BASIC:
      return <BasicQuestionBottomPane />;
    case QuestionType.REORDERING:
      return <ReorderingBottomPane baseQuestion={baseQuestion as never} />;
    default:
      return null;
  }
}
