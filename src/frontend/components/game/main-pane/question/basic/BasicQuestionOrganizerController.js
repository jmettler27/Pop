import { handleAnswer } from '@/backend/services/question/basic/actions';
import globalMessages from '@/i18n/globalMessages';

import { useIntl } from 'react-intl';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';

import useGame from '@/frontend/hooks/useGame';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import ClearBasicBuzzerButton from '@/frontend/components/game/main-pane/question/basic/ClearBasicBuzzerButton';

import { Button, ButtonGroup } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { QuestionType } from '@/backend/models/questions/QuestionType';

export default function BasicQuestionOrganizerController({ gameQuestion }) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BasicQuestionOrganizerAnswerController gameQuestion={gameQuestion} />
      <QuestionOrganizerController />
    </div>
  );
}

function BasicQuestionOrganizerAnswerController({ gameQuestion }) {
  const intl = useIntl();
  const game = useGame();

  const [validateBasicAnswer, isValidating] = useAsyncAction(async () => {
    await handleAnswer(game.id, game.currentRound, game.currentQuestion, gameQuestion.teamId, true);
  });

  const [invalidateBasicAnswer, isInvalidating] = useAsyncAction(async () => {
    await handleAnswer(game.id, game.currentRound, game.currentQuestion, gameQuestion.teamId, false);
  });

  {
    /* Validate or invalidate the player's answer */
  }
  return (
    <>
      <ButtonGroup
        disableElevation
        variant="contained"
        size="large"
        color="primary"
        // aria-label='outlined primary button group'
      >
        {/* Validate the player's answer */}
        <Button color="success" startIcon={<CheckCircleIcon />} onClick={validateBasicAnswer} disabled={isValidating}>
          {intl.formatMessage(globalMessages.validate)}
        </Button>

        {/* Invalidate the player's answer */}
        <Button color="error" startIcon={<CancelIcon />} onClick={invalidateBasicAnswer} disabled={isInvalidating}>
          {intl.formatMessage(globalMessages.invalidate)}
        </Button>
      </ButtonGroup>
    </>
  );
}

function QuestionOrganizerController({}) {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.BASIC} />
      <EndQuestionButton questionType={QuestionType.BASIC} />
      <ClearBasicBuzzerButton />
    </div>
  );
}
