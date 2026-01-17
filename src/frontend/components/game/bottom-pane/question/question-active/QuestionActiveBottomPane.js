import { useGameContext } from '@/frontend/contexts';

import BuzzerBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/BuzzerBottomPane';
import QuoteBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/quote/QuoteBottomPane';
import MatchingBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/matching/MatchingBottomPane';
import EnumerationBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/enumeration/EnumerationBottomPane';
import OddOneOutBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/odd_one_out/OddOneOutBottomPane';
import MCQBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/mcq/MCQBottomPane';
import BasicQuestionBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/basic/BasicQuestionBottomPane';
import NaguiBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/nagui/NaguiBottomPane';
//import LabelBottomPane from '@/app/(game)/[id]/components/bottom-pane/question/question-active/labelling/LabelBottomPane'

import LoadingScreen from '@/frontend/components/LoadingScreen';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

export default function QuestionActiveBottomPane({}) {
  const game = useGameContext();

  const baseQuestionRepo = new BaseQuestionRepository();
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

  switch (baseQuestion.type) {
    case QuestionType.PROGRESSIVE_CLUES:
    case QuestionType.IMAGE:
    case QuestionType.BLINDTEST:
    case QuestionType.EMOJI:
      return <BuzzerBottomPane baseQuestion={baseQuestion} />;
    case QuestionType.QUOTE:
      return <QuoteBottomPane baseQuestion={baseQuestion} />;
    // case QuestionType.LABELLING:
    //     return <LabelBottomPane baseQuestion={baseQuestion} />
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
