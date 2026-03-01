import { useGameContext } from '@/frontend/contexts';

import BuzzerBottomPane from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerBottomPane';
import QuoteBottomPane from '@/frontend/components/game/bottom-pane/question/quote/QuoteBottomPane';
import MatchingBottomPane from '@/frontend/components/game/bottom-pane/question/matching/MatchingBottomPane';
import EnumerationBottomPane from '@/frontend/components/game/bottom-pane/question/enumeration/EnumerationBottomPane';
import OddOneOutBottomPane from '@/frontend/components/game/bottom-pane/question/odd_one_out/OddOneOutBottomPane';
import MCQBottomPane from '@/frontend/components/game/bottom-pane/question/mcq/MCQBottomPane';
import BasicQuestionBottomPane from '@/frontend/components/game/bottom-pane/question/basic/BasicQuestionBottomPane';
import NaguiBottomPane from '@/frontend/components/game/bottom-pane/question/nagui/NaguiBottomPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import LabellingBottomPane from '@/frontend/components/game/bottom-pane/question/labelling/LabellingBottomPane';

export default function QuestionActiveBottomPane({}) {
  const game = useGameContext();
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
    return (
      <p>
        <strong>Error: {JSON.stringify(baseQuestionError)}</strong>
      </p>
    );
  }
  if (baseQuestionLoading) {
    return <LoadingScreen />;
  }
  if (!baseQuestion) {
    return <></>;
  }
  console.log('baseQuestion', baseQuestion);

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
  }
}
