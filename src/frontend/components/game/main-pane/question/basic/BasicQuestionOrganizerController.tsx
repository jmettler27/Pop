import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, ButtonGroup } from '@mui/material';
import { useIntl } from 'react-intl';

import { handleAnswer } from '@/backend/services/question/basic/actions';
import ClearBasicBuzzerButton from '@/frontend/components/game/main-pane/question/basic/ClearBasicBuzzerButton';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { GameBasicQuestion } from '@/models/questions/basic';
import { QuestionType } from '@/models/questions/question-type';

interface BasicQuestionOrganizerControllerProps {
  gameQuestion: GameBasicQuestion;
}

export default function BasicQuestionOrganizerController({ gameQuestion }: BasicQuestionOrganizerControllerProps) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BasicQuestionOrganizerAnswerController gameQuestion={gameQuestion} />
      <QuestionOrganizerController />
    </div>
  );
}

interface BasicQuestionOrganizerAnswerControllerProps {
  gameQuestion: GameBasicQuestion;
}

function BasicQuestionOrganizerAnswerController({ gameQuestion }: BasicQuestionOrganizerAnswerControllerProps) {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const gq = gameQuestion as { teamId?: string };

  const [validateBasicAnswer, isValidating] = useAsyncAction(async () => {
    await handleAnswer(
      game!.id as string,
      currentRound as string,
      game!.currentQuestion as string,
      gq.teamId as string,
      true
    );
  });

  const [invalidateBasicAnswer, isInvalidating] = useAsyncAction(async () => {
    await handleAnswer(
      game!.id as string,
      currentRound as string,
      game!.currentQuestion as string,
      gq.teamId as string,
      false
    );
  });

  return (
    <>
      <ButtonGroup disableElevation variant="contained" size="large" color="primary">
        <Button color="success" startIcon={<CheckCircleIcon />} onClick={validateBasicAnswer} disabled={isValidating}>
          {intl.formatMessage(globalMessages.validate)}
        </Button>
        <Button color="error" startIcon={<CancelIcon />} onClick={invalidateBasicAnswer} disabled={isInvalidating}>
          {intl.formatMessage(globalMessages.invalidate)}
        </Button>
      </ButtonGroup>
    </>
  );
}

function QuestionOrganizerController() {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.BASIC} />
      <EndQuestionButton questionType={QuestionType.BASIC} />
      <ClearBasicBuzzerButton />
    </div>
  );
}
