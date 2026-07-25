import { CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { handleAnswer } from '@/backend/services/question/basic/actions';
import ClearBasicBuzzerButton from '@/frontend/components/game/main-pane/question/basic/ClearBasicBuzzerButton';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import { Button } from '@/frontend/components/ui/button';
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
      <div className="flex gap-1">
        <Button
          size="lg"
          className="bg-green-600 text-white hover:bg-green-600/80"
          onClick={validateBasicAnswer}
          disabled={isValidating}
        >
          <CheckCircle2 className="mr-2 size-4" />
          {intl.formatMessage(globalMessages.validate)}
        </Button>
        <Button variant="destructive" size="lg" onClick={invalidateBasicAnswer} disabled={isInvalidating}>
          <XCircle className="mr-2 size-4" />
          {intl.formatMessage(globalMessages.invalidate)}
        </Button>
      </div>
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
