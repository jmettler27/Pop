import { resetQuestion as resetBasicQuestion } from '@/backend/services/question/basic/actions';
import { resetQuestion as resetBlindtestQuestion } from '@/backend/services/question/blindtest/actions';
import { resetQuestion as resetEmojiQuestion } from '@/backend/services/question/emoji/actions';
import { resetQuestion as resetEnumQuestion } from '@/backend/services/question/enumeration/actions';
import { resetQuestion as resetImageQuestion } from '@/backend/services/question/image/actions';
import { resetQuestion as resetMatchingQuestion } from '@/backend/services/question/matching/actions';
import { resetQuestion as resetMCQQuestion } from '@/backend/services/question/mcq/actions';
import { resetQuestion as resetNaguiQuestion } from '@/backend/services/question/nagui/actions';
import { resetQuestion as resetOddOneOutQuestion } from '@/backend/services/question/odd-one-out/actions';
import { resetQuestion as resetProgressiveCluesQuestion } from '@/backend/services/question/progressive-clues/actions';
import { resetQuestion as resetQuoteQuestion } from '@/backend/services/question/quote/actions';
import { resetQuestion as resetReorderingQuestion } from '@/backend/services/question/reordering/actions';

import { QuestionType } from '@/backend/models/questions/QuestionType';

import { useGameContext } from '@/frontend/contexts';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { Button } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

/**
 * Reset the question
 * @param {Object} props
 * @param {string} props.lang - Language code
 * @param {string} props.questionType - Type of question to reset
 * @returns
 */
export default function ResetQuestionButton({ lang = DEFAULT_LOCALE, questionType }) {
  const game = useGameContext();

  const getResetAction = () => {
    switch (questionType) {
      case QuestionType.BASIC:
        return resetBasicQuestion;
      case QuestionType.BLINDTEST:
        return resetBlindtestQuestion;
      case QuestionType.EMOJI:
        return resetEmojiQuestion;
      case QuestionType.ENUMERATION:
        return resetEnumQuestion;
      case QuestionType.IMAGE:
        return resetImageQuestion;
      case QuestionType.MATCHING:
        return resetMatchingQuestion;
      case QuestionType.MCQ:
        return resetMCQQuestion;
      case QuestionType.NAGUI:
        return resetNaguiQuestion;
      case QuestionType.ODD_ONE_OUT:
        return resetOddOneOutQuestion;
      case QuestionType.PROGRESSIVE_CLUES:
        return resetProgressiveCluesQuestion;
      case QuestionType.QUOTE:
        return resetQuoteQuestion;
      case QuestionType.REORDERING:
        return resetReorderingQuestion;
      default:
        throw new Error(`Unsupported question type: ${questionType}`);
    }
  };

  const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
    const resetAction = getResetAction();
    await resetAction(game.id, game.currentRound, game.currentQuestion);
  });

  return (
    <Button
      variant="outlined"
      color="warning"
      startIcon={<RestartAltIcon />}
      onClick={handleResetQuestion}
      disabled={isResetting}
    >
      {RESET_QUESTION_BUTTON_LABEL[lang]}
    </Button>
  );
}

const RESET_QUESTION_BUTTON_LABEL = {
  en: 'Reset question',
  'fr-FR': 'Réinitialiser la question',
};
