import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, ButtonGroup } from '@mui/material';
import { useIntl } from 'react-intl';

import { handleHideAnswer } from '@/backend/services/question/nagui/actions';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/QuestionType';

export default function NaguiOrganizerController({ gameQuestion }) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      {/* <BuzzerHeadPlayer gameQuestion={gameQuestion} />
       */}
      {gameQuestion.option === null && gameQuestion.teamId && (
        <span className="2xl:text-4xl font-bold">
          <GameChooserHelperText chooserTeamId={gameQuestion.teamId} />
        </span>
      )}
      {gameQuestion.option !== null && (
        <span className="2xl:text-4xl">
          <NaguiPlayerOptionHelperText gameQuestion={gameQuestion} />
        </span>
      )}
      {gameQuestion.option === 'hide' && <NaguiOrganizerHideAnswerController gameQuestion={gameQuestion} />}
      <div className="flex flex-row w-full justify-end">
        <ResetQuestionButton questionType={QuestionType.NAGUI} />
        <EndQuestionButton questionType={QuestionType.NAGUI} />
      </div>
    </div>
  );
}

function NaguiOrganizerHideAnswerController({ gameQuestion }) {
  const intl = useIntl();
  const game = useGame();

  const [handleClick, isHandling] = useAsyncAction(async (correct) => {
    await handleHideAnswer(
      game.id,
      game.currentRound,
      game.currentQuestion,
      gameQuestion.playerId,
      gameQuestion.teamId,
      correct
    );
  });

  {
    /* Validate or invalidate the player's answer */
  }
  return (
    <>
      <ButtonGroup disableElevation variant="contained" size="large" color="primary">
        {/* Validate the player's answer */}
        <Button color="success" startIcon={<CheckCircleIcon />} onClick={() => handleClick(true)} disabled={isHandling}>
          {intl.formatMessage(globalMessages.validate)}
        </Button>

        {/* Invalidate the player's answer */}
        <Button color="error" startIcon={<CancelIcon />} onClick={() => handleClick(false)} disabled={isHandling}>
          {intl.formatMessage(globalMessages.invalidate)}
        </Button>
      </ButtonGroup>
    </>
  );
}
