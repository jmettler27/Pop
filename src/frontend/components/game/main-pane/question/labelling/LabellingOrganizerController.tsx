import { useEffect, useRef } from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { questionAction } from '@/frontend/api';
import BuzzerHeadPlayer from '@/frontend/components/game/main-pane/question/buzzer/BuzzerHeadPlayer';
import ClearBuzzerButton from '@/frontend/components/game/main-pane/question/buzzer/ClearBuzzerButton';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import RevealLabelButton from '@/frontend/components/game/main-pane/question/labelling/RevealLabelButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import { Button } from '@/frontend/components/ui/button';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { QuestionType } from '@/models/questions/question-type';
import { isEmpty } from '@/utils/arrays';

interface LabellingOrganizerControllerProps {
  baseQuestion: LabellingQuestion;
  questionPlayers: {
    buzzed: string[];
  };
}

export default function LabellingOrganizerController({
  baseQuestion,
  questionPlayers,
}: LabellingOrganizerControllerProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const { buzzed } = questionPlayers;
  const buzzerHead = useRef<string | null>(null);

  useEffect(() => {
    if (!buzzed || buzzed.length === 0) {
      buzzerHead.current = null;
      return;
    }
    const buzzerHeadId = buzzed[0]!;
    if (buzzerHead.current !== buzzerHeadId) {
      buzzerHead.current = buzzerHeadId;
      questionAction(gameId, roundId, questionId, { action: 'handle_buzzer_head_changed', playerId: buzzerHeadId });
    }
  }, [buzzed, gameId, roundId, questionId]);

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BuzzerHeadPlayer buzzed={buzzed} />
      <LabelOrganizerAnswerController buzzed={buzzed} baseQuestion={baseQuestion} />
      <LabelOrganizerQuestionController />
    </div>
  );
}

function LabelOrganizerAnswerController({
  buzzed,
  baseQuestion,
}: {
  buzzed: string[];
  baseQuestion: LabellingQuestion;
}) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.LABELLING, questionId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  return (
    <>
      <div className="flex gap-1">
        <ValidateAllLabelsButton buzzed={buzzed} gameQuestion={gameQuestion as GameLabellingQuestion} />
        <CancelLabelButton buzzed={buzzed} />
        <RevealLabelButton
          buzzed={buzzed}
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestion as GameLabellingQuestion}
        />
      </div>
    </>
  );
}

function ValidateAllLabelsButton({ buzzed, gameQuestion }: { buzzed: string[]; gameQuestion: GameLabellingQuestion }) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const atLeastOneRevealed = gameQuestion.atLeastOneLabelIsRevealed();
  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleValidateAll, isValidating] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'validate_all_labels', playerId: buzzed[0] });
  });

  return (
    <Button
      className="bg-green-600 text-white hover:bg-green-600/80"
      onClick={handleValidateAll}
      disabled={atLeastOneRevealed || buzzedIsEmpty || isValidating}
    >
      <CheckCircle2 className="mr-2 size-4" />
      {intl.formatMessage(globalMessages.validateAll)}
    </Button>
  );
}

function CancelLabelButton({ buzzed }: { buzzed: string[] }) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleCancelLabel, isCanceling] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'cancel_player', playerId: buzzed[0] });
  });

  return (
    <>
      <Button variant="destructive" onClick={handleCancelLabel} disabled={buzzedIsEmpty || isCanceling}>
        <XCircle className="mr-2 size-4" />
        {intl.formatMessage(globalMessages.cancel)}
      </Button>
    </>
  );
}

function LabelOrganizerQuestionController() {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton />
      <EndQuestionButton />
      <ClearBuzzerButton questionType={QuestionType.LABELLING} />
    </div>
  );
}
