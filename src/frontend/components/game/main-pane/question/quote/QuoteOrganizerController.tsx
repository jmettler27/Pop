'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import {
  cancelPlayer,
  handleBuzzerHeadChanged,
  validateAllQuoteElements,
} from '@/backend/services/question/quote/actions';
import { isEmpty } from '@/backend/utils/arrays';
import BuzzerHeadPlayer from '@/frontend/components/game/main-pane/question/buzzer/BuzzerHeadPlayer';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ClearQuoteBuzzerButton from '@/frontend/components/game/main-pane/question/quote/ClearQuoteBuzzerButton';
import RevealQuoteElementButton from '@/frontend/components/game/main-pane/question/quote/RevealQuoteElement';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import { Button } from '@/frontend/components/ui/button';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/question-type';
import { GameQuoteQuestion, QuoteQuestion } from '@/models/questions/quote';

interface QuestionPlayers {
  buzzed: string[];
  canceled: { playerId: string }[];
}

export default function QuoteOrganizerController({
  baseQuestion,
  questionPlayers,
}: {
  baseQuestion: QuoteQuestion;
  questionPlayers: Record<string, unknown>;
}) {
  const { id } = useParams();
  const gameId = id as string;
  const game = useGame();

  const playersData = questionPlayers as unknown as QuestionPlayers;
  const { buzzed } = playersData;
  const buzzerHead = useRef<string | null>(null);

  useEffect(() => {
    if (!game) return;
    if (!buzzed || buzzed.length === 0) {
      buzzerHead.current = null;
      return;
    }
    if (buzzerHead.current !== buzzed[0]) {
      buzzerHead.current = buzzed[0]!;
      handleBuzzerHeadChanged(
        gameId as string,
        game.currentRound as string,
        game.currentQuestion as string,
        buzzerHead.current
      );
    }
  }, [buzzed, gameId, game]);

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BuzzerHeadPlayer buzzed={buzzed} />
      <QuoteOrganizerAnswerController buzzed={buzzed} baseQuestion={baseQuestion} />
      <QuoteOrganizerQuestionController />
    </div>
  );
}

function QuoteOrganizerAnswerController({ buzzed, baseQuestion }: { buzzed: string[]; baseQuestion: QuoteQuestion }) {
  const game = useGame();

  const gameQuestionRepo = new GameQuoteQuestionRepository(game?.id as string, game?.currentRound as string);
  const { gameQuestion, loading, error } = useQuestion(gameQuestionRepo, game?.currentQuestion as string);

  if (!game) return null;

  if (error || loading || !gameQuestion) {
    return <></>;
  }

  const gameQuestionData = gameQuestion as unknown as GameQuoteQuestion;

  return (
    <>
      <div className="flex gap-1">
        <ValidateAllQuoteElementsButton buzzed={buzzed} gameQuestion={gameQuestionData} />
        <CancelQuoteElementButton buzzed={buzzed} />
        <RevealQuoteElementButton buzzed={buzzed} baseQuestion={baseQuestion} gameQuestion={gameQuestionData} />
      </div>
    </>
  );
}

function ValidateAllQuoteElementsButton({
  buzzed,
  gameQuestion,
}: {
  buzzed: string[];
  gameQuestion: GameQuoteQuestion;
}) {
  const intl = useIntl();
  const game = useGame();

  const atLeastOneRevealed = gameQuestion.atLeastOneElementRevealed();
  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleValidateAll, isValidating] = useAsyncAction(async () => {
    if (!game) return;
    await validateAllQuoteElements(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      buzzed[0]!
    );
  });

  return (
    <Button
      size="lg"
      className="bg-green-600 text-white hover:bg-green-600/80"
      onClick={handleValidateAll}
      disabled={atLeastOneRevealed || buzzedIsEmpty || isValidating}
    >
      <CheckCircle2 className="mr-2 size-4" />
      {intl.formatMessage(globalMessages.validateAll)}
    </Button>
  );
}

function CancelQuoteElementButton({ buzzed }: { buzzed: string[] }) {
  const intl = useIntl();
  const game = useGame();

  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleCancelQuote, isCanceling] = useAsyncAction(async () => {
    if (!game) return;
    await cancelPlayer(game.id as string, game.currentRound as string, game.currentQuestion as string, buzzed[0]!);
  });

  return (
    <>
      <Button variant="destructive" size="lg" onClick={handleCancelQuote} disabled={buzzedIsEmpty || isCanceling}>
        <XCircle className="mr-2 size-4" />
        {intl.formatMessage(globalMessages.cancel)}
      </Button>
    </>
  );
}

function QuoteOrganizerQuestionController() {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.QUOTE} />
      <EndQuestionButton questionType={QuestionType.QUOTE} />
      <ClearQuoteBuzzerButton />
    </div>
  );
}
