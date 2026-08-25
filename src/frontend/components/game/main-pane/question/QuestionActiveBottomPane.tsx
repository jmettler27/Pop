'use client';

import BasicQuestionBottomPane from '@/frontend/components/game/main-pane/question/basic/BasicQuestionBottomPane';
import BuzzerBottomPane from '@/frontend/components/game/main-pane/question/buzzer/BuzzerBottomPane';
import EnumerationBottomPane from '@/frontend/components/game/main-pane/question/enumeration/EnumerationBottomPane';
import EstimationBottomPane from '@/frontend/components/game/main-pane/question/estimation/EstimationBottomPane';
import LabellingBottomPane from '@/frontend/components/game/main-pane/question/labelling/LabellingBottomPane';
import MatchingBottomPane from '@/frontend/components/game/main-pane/question/matching/MatchingBottomPane';
import MCQBottomPane from '@/frontend/components/game/main-pane/question/mcq/MCQBottomPane';
import NaguiBottomPane from '@/frontend/components/game/main-pane/question/nagui/NaguiBottomPane';
import OddOneOutBottomPane from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutBottomPane';
import QuoteBottomPane from '@/frontend/components/game/main-pane/question/quote/QuoteBottomPane';
import ReorderingBottomPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingBottomPane';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestionOnce } from '@/frontend/hooks/firestore/question/useBaseQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import { QuestionType } from '@/models/questions/question-type';

export default function QuestionActiveBottomPane() {
  const { questionId } = useActiveQuestion()!;

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useQuestionOnce(questionId);

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
