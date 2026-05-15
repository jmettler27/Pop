'use client';

import { CircularProgress } from '@mui/material';

import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
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
import useGame from '@/frontend/hooks/useGame';
import { QuestionType } from '@/models/questions/question-type';

export default function QuestionMiddlePane() {
  const game = useGame();

  const questionType = (game!.currentQuestionType ?? '') as QuestionType;
  const baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(questionType);
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(
    game!.currentQuestion as string
  );

  if (!game) return null;
  if (baseQuestionError) return <ErrorScreen inline />;
  if (baseQuestionLoading) return <LoadingScreen inline />;
  if (!baseQuestion) return null;

  switch (baseQuestion.type) {
    case QuestionType.BASIC:
      return <BasicMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.BLINDTEST:
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.PROGRESSIVE_CLUES:
      return <BuzzerMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.ENUMERATION:
      return <EnumerationMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.ESTIMATION:
      return <EstimationMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.LABELLING:
      return <LabellingMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.MATCHING:
      return <MatchingMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.MCQ:
      return <MCQMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.NAGUI:
      return <NaguiMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.ODD_ONE_OUT:
      return <OddOneOutMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.QUOTE:
      return <QuoteMiddlePane baseQuestion={baseQuestion as never} />;
    case QuestionType.REORDERING:
      return <ReorderingMiddlePane baseQuestion={baseQuestion as never} />;
    default:
      return null;
  }
}
