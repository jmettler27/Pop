import useGame from '@/frontend/hooks/useGame';

import BuzzerBottomPane from '@/frontend/components/game/main-pane/question/buzzer/BuzzerBottomPane';
import QuoteBottomPane from '@/frontend/components/game/main-pane/question/quote/QuoteBottomPane';
import MatchingBottomPane from '@/frontend/components/game/main-pane/question/matching/MatchingBottomPane';
import EnumerationBottomPane from '@/frontend/components/game/main-pane/question/enumeration/EnumerationBottomPane';
import OddOneOutBottomPane from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutBottomPane';
import MCQBottomPane from '@/frontend/components/game/main-pane/question/mcq/MCQBottomPane';
import BasicQuestionBottomPane from '@/frontend/components/game/main-pane/question/basic/BasicQuestionBottomPane';
import NaguiBottomPane from '@/frontend/components/game/main-pane/question/nagui/NaguiBottomPane';
import ReorderingBottomPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingBottomPane';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import LabellingBottomPane from '@/frontend/components/game/main-pane/question/labelling/LabellingBottomPane';
import { CircularProgress } from '@mui/material';

export default function QuestionActiveBottomPane({}) {
  const game = useGame();
  if (!game.currentQuestionType) {
    return <></>;
  }
  if (!game.currentQuestion) {
    return <></>;
  }

  const baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(game.currentQuestionType);
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(
    game.currentQuestion
  );

  if (baseQuestionError) {
    return <></>;
  }
  if (baseQuestionLoading) {
    return <CircularProgress />;
  }
  if (!baseQuestion) {
    return <></>;
  }

  switch (baseQuestion.type) {
    case QuestionType.PROGRESSIVE_CLUES:
    case QuestionType.IMAGE:
    case QuestionType.BLINDTEST:
    case QuestionType.EMOJI:
      return <BuzzerBottomPane baseQuestion={baseQuestion} />;
    case QuestionType.QUOTE:
      return <QuoteBottomPane baseQuestion={baseQuestion} />;
    case QuestionType.LABELLING:
      return <LabellingBottomPane baseQuestion={baseQuestion} />;
    case QuestionType.ENUMERATION:
      return <EnumerationBottomPane baseQuestion={baseQuestion} />;
    case QuestionType.ODD_ONE_OUT:
      return <OddOneOutBottomPane />;
    case QuestionType.MATCHING:
      return <MatchingBottomPane />;
    case QuestionType.MCQ:
      return <MCQBottomPane baseQuestion={baseQuestion} />;
    case QuestionType.NAGUI:
      return <NaguiBottomPane />;
    case QuestionType.BASIC:
      return <BasicQuestionBottomPane />;
    case QuestionType.REORDERING:
      return <ReorderingBottomPane baseQuestion={baseQuestion} />;
  }
}
