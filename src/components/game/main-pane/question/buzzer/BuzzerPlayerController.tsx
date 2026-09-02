import clsx from 'clsx';
import { Hand, RotateCcw } from 'lucide-react';
import { useIntl, type IntlShape } from 'react-intl';

import { QUESTION_ACTIONS, questionAction } from '@/api';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuestion } from '@/hooks/firestore/question/useGameQuestionHooks';
import { useRound } from '@/hooks/firestore/round/useRoundHooks';
import { usePlayer } from '@/hooks/firestore/user/usePlayerHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import useUser from '@/hooks/useUser';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { type QuestionType } from '@/models/questions/question-type';
import { type AnyRound } from '@/models/rounds/RoundFactory';
import { PlayerStatus } from '@/models/users/player';

const messages = defineMessages('frontend.game.BuzzerPlayerController', {
  numRemainingClues: 'in {remaining} clues',
});

interface QuestionPlayers {
  buzzed: string[];
  canceled: { playerId: string; clueIdx?: number; [key: string]: unknown }[];
  [key: string]: unknown;
}

interface BuzzerPlayerControllerProps {
  questionPlayers: Record<string, unknown>;
  compact?: boolean;
}

export default function BuzzerPlayerController({ questionPlayers, compact = false }: BuzzerPlayerControllerProps) {
  const { gameId, roundId, questionId, questionType } = useActiveQuestion()!;
  const user = useUser();
  const { player, loading: playerLoading, error: playerError } = usePlayer(gameId, user?.id as string);

  const { round, loading: roundLoading, error: roundError } = useRound(gameId, roundId);

  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = useQuestion(gameId, roundId, questionType, questionId);

  if (playerError || roundError || gameQuestionError) {
    return <></>;
  }
  if (playerLoading || roundLoading || gameQuestionLoading) {
    return <></>;
  }
  if (!player || !round || !gameQuestion) {
    return <></>;
  }

  const qp = questionPlayers as QuestionPlayers;
  const { buzzed, canceled } = qp;

  const hasBuzzed = buzzed.includes(user?.id as string);
  const isFirst = hasBuzzed && buzzed[0] === user?.id;

  const myCanceledItems = canceled.filter((item) => item.playerId === user?.id);
  const r = round as unknown as { maxTries?: number; delay?: number; type?: string };
  const hasExceededMaxTries = myCanceledItems && myCanceledItems.length >= (r.maxTries ?? 0);
  const gq = gameQuestion as { currentClueIdx?: number; type?: QuestionType };
  const remaining = remainingWaitingClues(round, hasExceededMaxTries, gq.currentClueIdx ?? 0, myCanceledItems);

  return (
    <div className={clsx('flex flex-col items-center', compact ? 'gap-8' : 'h-full justify-around')}>
      <BuzzerMessage
        playerStatus={player.status}
        hasExceededMaxTries={hasExceededMaxTries}
        round={round}
        myCanceledItems={myCanceledItems}
        isFirst={isFirst}
        hasBuzzed={hasBuzzed}
        remaining={remaining}
      />
      <div
        className={clsx(
          'flex w-full justify-center',
          compact ? 'flex-col items-center gap-3' : 'flex-row items-center gap-2'
        )}
      >
        <BuzzerButton isDisabled={hasBuzzed || hasExceededMaxTries || remaining > 0} compact={compact} />
        <BuzzerResetButton isDisabled={!hasBuzzed || hasExceededMaxTries} compact={compact} />
      </div>
    </div>
  );
}

const numRemainingClues = (remaining: number, intl: IntlShape) => {
  return intl.formatMessage(messages.numRemainingClues, { remaining });
};

interface BuzzerMessageProps {
  playerStatus: string | undefined;
  hasExceededMaxTries: boolean;
  round: AnyRound;
  myCanceledItems: { playerId: string; clueIdx?: number; [key: string]: unknown }[];
  isFirst: boolean;
  hasBuzzed: boolean;
  remaining: number;
}

function BuzzerMessage({
  playerStatus,
  hasExceededMaxTries,
  round,
  myCanceledItems,
  isFirst,
  hasBuzzed,
  remaining,
}: BuzzerMessageProps) {
  const intl = useIntl();
  const r = round as unknown as { maxTries?: number; delay?: number; type?: string };
  if (hasExceededMaxTries)
    return (
      <span className="text-2xl 2xl:text-3xl text-red-500">
        🤐 {intl.formatMessage(globalMessages.maxTriesExceeded)} ({r.maxTries})
      </span>
    );

  if (playerStatus === PlayerStatus.WRONG) {
    const message = intl.formatMessage(globalMessages.wrongAnswer);
    if (r.type === 'progressive_clues' && r.delay && r.delay > 0) {
      return (
        <span className="text-2xl 2xl:text-3xl">
          {message} {intl.formatMessage(globalMessages.buzzAgain)}{' '}
          <span className="font-bold text-blue-500">
            {remaining > 1 ? numRemainingClues(remaining, intl) : intl.formatMessage(globalMessages.nextClue)}.
          </span>
        </span>
      );
    }
    return <span className="text-2xl 2xl:text-3xl text-red-500">{message}</span>;
  }
  if (isFirst) {
    const message = `${intl.formatMessage(globalMessages.firstBuzzer)} 🧐`;
    if (myCanceledItems.length === (r.maxTries ?? 0) - 1)
      return (
        <span className="text-2xl 2xl:text-3xl">
          {message}. <span className="text-red-500">{intl.formatMessage(globalMessages.lastAttempt)}</span>
        </span>
      );
    return <span className="text-2xl 2xl:text-3xl">{message}</span>;
  }
  if (hasBuzzed) return <span className="text-2xl 2xl:text-3xl">{intl.formatMessage(globalMessages.waitForTurn)}</span>;
  return <span className="text-2xl 2xl:text-3xl">{intl.formatMessage(globalMessages.anyIdea)} 🤔</span>;
}

function remainingWaitingClues(
  round: AnyRound,
  hasExceededMaxTries: boolean,
  currentClueIdx: number,
  myCanceledItems: { clueIdx?: number; [key: string]: unknown }[]
): number {
  const r = round as unknown as { delay?: number };
  if (!r.delay) return 0;
  if (myCanceledItems.length === 0) return 0;
  if (hasExceededMaxTries) return 1;
  const lastCanceledClueIdx = myCanceledItems.reduce((acc, item) => {
    if ((item.clueIdx ?? -1) > acc) return item.clueIdx ?? -1;
    return acc;
  }, -1);
  return r.delay - (currentClueIdx - lastCanceledClueIdx);
}

interface BuzzerButtonProps {
  isDisabled: boolean;
  compact?: boolean;
}

function BuzzerButton({ isDisabled, compact = false }: BuzzerButtonProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleBuzz, isBuzzing] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: QUESTION_ACTIONS.BuzzerPress });
  });

  return (
    <Button
      size="lg"
      onClick={handleBuzz}
      disabled={isDisabled || isBuzzing}
      style={{ backgroundColor: isDisabled ? 'gray' : 'red' }}
      className={clsx(compact ? 'py-2 px-4' : 'py-8 px-6')}
    >
      <span className={clsx('text-3xl', !isDisabled && 'text-slate-100')}>BUZZ</span>
      <Hand className={clsx('ml-2 text-white', compact ? 'size-6' : 'size-6 2xl:size-8')} />
    </Button>
  );
}

interface BuzzerResetButtonProps {
  isDisabled: boolean;
  compact?: boolean;
}

function BuzzerResetButton({ isDisabled, compact = false }: BuzzerResetButtonProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleResetBuzz, isResetting] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: QUESTION_ACTIONS.BuzzerRelease });
  });

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          variant="ghost"
          size={compact ? 'icon-lg' : 'icon'}
          aria-label="reset buzzer"
          onClick={handleResetBuzz}
          disabled={isDisabled || isResetting}
        >
          <RotateCcw className={compact ? 'size-7' : 'size-6'} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">Annuler</TooltipContent>
    </Tooltip>
  );
}
