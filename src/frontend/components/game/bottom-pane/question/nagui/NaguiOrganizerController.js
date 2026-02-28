import { handleHideAnswer } from '@/backend/services/question/nagui/actions';

import { QuestionType } from '@/backend/models/questions/QuestionType';

import { INVALIDATE_ANSWER, VALIDATE_ANSWER } from '@/backend/utils/question/question';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext } from '@/frontend/contexts';

import { GameChooserHelperText } from '@/frontend/components/game/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/ResetQuestionButton';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/bottom-pane/question/nagui/NaguiPlayerOptionHelperText';

import { Button, ButtonGroup } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

export default function NaguiOrganizerController({ gameQuestion }) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      {/* <BuzzerHeadPlayer gameQuestion={gameQuestion} />
       */}
      {gameQuestion.option === null && (
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

function NaguiOrganizerHideAnswerController({ gameQuestion, lang = DEFAULT_LOCALE }) {
  const game = useGameContext();

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
          {VALIDATE_ANSWER[lang]}
        </Button>

        {/* Invalidate the player's answer */}
        <Button color="error" startIcon={<CancelIcon />} onClick={() => handleClick(false)} disabled={isHandling}>
          {INVALIDATE_ANSWER[lang]}
        </Button>
      </ButtonGroup>
    </>
  );
}
