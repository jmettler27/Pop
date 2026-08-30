import { CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { questionAction } from '@/api';
import ClearBasicBuzzerButton from '@/components/game/main-pane/question/basic/ClearBasicBuzzerButton';
import EndQuestionButton from '@/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/components/game/main-pane/question/ResetQuestionButton';
import { Button } from '@/components/ui/button';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import globalMessages from '@/i18n/globalMessages';
import { GameBasicQuestion } from '@/models/questions/basic';

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
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const gq = gameQuestion as { teamId?: string };

  const [validateBasicAnswer, isValidating] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'handle_answer', teamId: gq.teamId, correct: true });
  });

  const [invalidateBasicAnswer, isInvalidating] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'handle_answer', teamId: gq.teamId, correct: false });
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
      <ResetQuestionButton />
      <EndQuestionButton />
      <ClearBasicBuzzerButton />
    </div>
  );
}
