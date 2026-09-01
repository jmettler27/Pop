'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { QUESTION_ACTIONS, questionAction } from '@/api';
import { GameChooserHelperText } from '@/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/components/game/main-pane/question/EndQuestionButton';
import NaguiPlayerOptionHelperText from '@/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import ResetQuestionButton from '@/components/game/main-pane/question/ResetQuestionButton';
import { Button } from '@/components/ui/button';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import globalMessages from '@/i18n/globalMessages';
import { GameNaguiQuestion } from '@/models/questions/nagui';

export default function NaguiOrganizerController({ gameQuestion }: { gameQuestion: GameNaguiQuestion }) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
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
        <ResetQuestionButton />
        <EndQuestionButton />
      </div>
    </div>
  );
}

function NaguiOrganizerHideAnswerController({ gameQuestion }: { gameQuestion: GameNaguiQuestion }) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleClick, isHandling] = useAsyncAction(async (correct: boolean) => {
    await questionAction(gameId, roundId, questionId, {
      action: QUESTION_ACTIONS.NaguiHandleHideAnswer,
      playerId: gameQuestion.playerId ?? undefined,
      teamId: gameQuestion.teamId ?? undefined,
      correct,
    });
  });

  return (
    <>
      <div className="flex gap-1">
        <Button
          className="bg-green-600 text-white hover:bg-green-600/80"
          onClick={() => handleClick(true)}
          disabled={isHandling}
        >
          <CheckCircle2 className="mr-2 size-4" />
          {intl.formatMessage(globalMessages.validate)}
        </Button>
        <Button variant="destructive" onClick={() => handleClick(false)} disabled={isHandling}>
          <XCircle className="mr-2 size-4" />
          {intl.formatMessage(globalMessages.invalidate)}
        </Button>
      </div>
    </>
  );
}
