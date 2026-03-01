import { handleAnswer } from '@/backend/services/question/basic/actions';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext } from '@/frontend/contexts';
import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/ResetQuestionButton';
import ClearBasicBuzzerButton from '@/frontend/components/game/bottom-pane/question/basic/ClearBasicBuzzerButton';

import { Button, ButtonGroup } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { QuestionType } from '@/backend/models/questions/QuestionType';

const messages = defineMessages('frontend.game.bottom.BasicQuestionOrganizerController', {
  validate: 'Validate',
  invalidate: 'Invalidate',
});

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
  const game = useGameContext();

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
          {intl.formatMessage(messages.validate)}
        </Button>

        {/* Invalidate the player's answer */}
        <Button color="error" startIcon={<CancelIcon />} onClick={invalidateBasicAnswer} disabled={isInvalidating}>
          {intl.formatMessage(messages.invalidate)}
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
