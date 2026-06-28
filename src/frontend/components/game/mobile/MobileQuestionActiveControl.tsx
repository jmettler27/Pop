'use client';

import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import GameChooserTeamAnnouncement from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EnumerationController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationController';
import QuestionMiddlePane from '@/frontend/components/game/main-pane/question/QuestionMiddlePane';
import MobileBuzzerControl from '@/frontend/components/game/mobile/MobileBuzzerControl';
import RotateDevicePrompt from '@/frontend/components/game/mobile/RotateDevicePrompt';
import useGame from '@/frontend/hooks/useGame';
import useOrientation, { Orientation } from '@/frontend/hooks/useOrientation';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';

import MobileMCQControl from '../main-pane/question/mcq/MobileMCQControl';
import MobileNaguiControl from '../main-pane/question/nagui/MobileNaguiControl';

const LANDSCAPE_REQUIRED_TYPES = new Set<QuestionType>([QuestionType.MATCHING]);

const MIDDLE_PANE_TYPES = new Set<QuestionType>([
  QuestionType.ESTIMATION,
  QuestionType.MATCHING,
  QuestionType.ODD_ONE_OUT,
  QuestionType.REORDERING,
]);

const BUZZER_TYPES = new Set<QuestionType>([
  QuestionType.BASIC,
  QuestionType.BLINDTEST,
  QuestionType.EMOJI,
  QuestionType.IMAGE,
  QuestionType.PROGRESSIVE_CLUES,
  QuestionType.QUOTE,
  QuestionType.LABELLING,
]);

export default function MobileQuestionActiveControl() {
  const game = useGame();
  const orientation = useOrientation();
  if (!game) return null;

  const questionType = game.currentQuestionType as QuestionType;

  if (LANDSCAPE_REQUIRED_TYPES.has(questionType) && orientation === Orientation.PORTRAIT) {
    return <RotateDevicePrompt />;
  }

  if (MIDDLE_PANE_TYPES.has(questionType)) {
    return (
      <div className="h-full overflow-auto py-4">
        <QuestionMiddlePane />
      </div>
    );
  }

  if (BUZZER_TYPES.has(questionType)) {
    return <MobileBuzzerControl />;
  }

  if (questionType === QuestionType.ENUMERATION) {
    return <MobileEnumerationControl />;
  }

  if (questionType === QuestionType.MCQ) {
    return <MobileMCQControl />;
  }

  if (questionType === QuestionType.NAGUI) {
    return <MobileNaguiControl />;
  }
  // BASIC: no digital buzzer — show who is playing this question
  return (
    <div className="flex items-center justify-center h-full p-6 text-center">
      <span className="text-2xl font-bold text-white">
        <GameChooserTeamAnnouncement />
      </span>
    </div>
  );
}

function MobileEnumerationControl() {
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
