import { useEffect, useRef } from 'react';

import { ArrowDown, CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { questionAction } from '@/api';
import BuzzerHeadPlayer from '@/components/game/main-pane/question/buzzer/BuzzerHeadPlayer';
import ClearBuzzerButton from '@/components/game/main-pane/question/buzzer/ClearBuzzerButton';
import EndQuestionButton from '@/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/components/game/main-pane/question/ResetQuestionButton';
import { Button } from '@/components/ui/button';
import { useQuestion } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { BuzzerQuestion } from '@/models/questions/buzzer';
import { GameProgressiveCluesQuestion, ProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.bottom.BuzzerOrganizerController', {
  nextClue: 'Next clue',
});

interface BuzzerOrganizerControllerProps {
  baseQuestion: BuzzerQuestion;
  questionPlayers: Record<string, unknown>;
}

export default function BuzzerOrganizerController({ baseQuestion, questionPlayers }: BuzzerOrganizerControllerProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const bq = baseQuestion as { type?: QuestionType };

  const { buzzed } = questionPlayers as { buzzed: string[] };
  const buzzerHead = useRef<string | null>(null);

  useEffect(() => {
    if (!buzzed || buzzed.length === 0) {
      buzzerHead.current = null;
      return;
    }
    if (buzzerHead.current !== buzzed[0]) {
      buzzerHead.current = buzzed[0];
      questionAction(gameId, roundId, questionId, {
        action: 'handle_buzzer_head_changed',
        playerId: buzzerHead.current as string,
      });
    }
  }, [buzzed, roundId, questionId, gameId]);

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BuzzerHeadPlayer buzzed={buzzed} />
      <BuzzerOrganizerAnswerController buzzed={buzzed} />
      <BuzzerOrganizerQuestionController baseQuestion={baseQuestion} />
    </div>
  );
}

interface BuzzerOrganizerAnswerControllerProps {
  buzzed: string[];
}

function BuzzerOrganizerAnswerController({ buzzed }: BuzzerOrganizerAnswerControllerProps) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const buzzedIsEmpty = buzzed.length === 0;

  const [handleValidate, isValidating] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'validate_answer', playerId: buzzed[0] });
  });

  const [handleInvalidate, isInvalidating] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'invalidate_answer', playerId: buzzed[0] });
  });

  return (
    <>
      <div className="flex gap-1">
        <Button
          size="lg"
          className="bg-green-600 text-white hover:bg-green-600/80"
          onClick={handleValidate}
          disabled={isValidating || buzzedIsEmpty}
        >
          <CheckCircle2 className="mr-2 size-4" />
          {intl.formatMessage(globalMessages.validate)}
        </Button>
        <Button variant="destructive" size="lg" onClick={handleInvalidate} disabled={isInvalidating || buzzedIsEmpty}>
          <XCircle className="mr-2 size-4" />
          {intl.formatMessage(globalMessages.invalidate)}
        </Button>
      </div>
    </>
  );
}

interface BuzzerOrganizerQuestionControllerProps {
  baseQuestion: BuzzerQuestion;
}

function BuzzerOrganizerQuestionController({ baseQuestion }: BuzzerOrganizerQuestionControllerProps) {
  const bq = baseQuestion as { type?: QuestionType; clues?: unknown[] };
  return (
    <div className="flex flex-row w-full justify-end">
      {bq.type === QuestionType.PROGRESSIVE_CLUES && <NextClueButton baseQuestion={baseQuestion} />}
      <ResetQuestionButton />
      <EndQuestionButton />
      <ClearBuzzerButton questionType={bq.type as QuestionType} />
    </div>
  );
}

function NextClueButton({ baseQuestion }: BuzzerOrganizerQuestionControllerProps) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleClick, isLoadingNextClue] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'reveal_clue' });
  });

  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = useQuestion(gameId, roundId, QuestionType.PROGRESSIVE_CLUES, questionId);

  if (gameQuestionError || gameQuestionLoading || !gameQuestion) {
    return <></>;
  }

  const progressiveCluesQuestion = gameQuestion as GameProgressiveCluesQuestion;
  const clues = (baseQuestion as ProgressiveCluesQuestion).clues;
  const isLastClue = (progressiveCluesQuestion.currentClueIdx ?? 0) >= (clues?.length ?? 0) - 1;

  return (
    <Button
      variant="outline"
      className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
      onClick={handleClick}
      disabled={isLastClue || isLoadingNextClue}
    >
      <ArrowDown className="mr-2 size-4" />
      {intl.formatMessage(messages.nextClue)}
    </Button>
  );
}
