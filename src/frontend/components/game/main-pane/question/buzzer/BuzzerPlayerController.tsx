import PanToolIcon from '@mui/icons-material/PanTool';
import ReplayIcon from '@mui/icons-material/Replay';
import { Button, IconButton, Tooltip } from '@mui/material';
import clsx from 'clsx';
import { useIntl, type IntlShape } from 'react-intl';

import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import { addPlayerToBuzzer, removePlayerFromBuzzer } from '@/backend/services/question/buzzer/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
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
  const game = useGame();
  const user = useUser();
  const gameRepositories = useGameRepositories();

  if (!game) return null;
  if (!gameRepositories) return null;
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const { playerRepo, roundRepo } = gameRepositories;

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    game.currentQuestionType as QuestionType,
    game.id as string,
    currentRound as string
  );

  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayer(user?.id as string);
  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

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
      <div className={clsx('flex w-full justify-center', compact ? 'flex-col items-center gap-3' : 'flex-row')}>
        <BuzzerButton
          isDisabled={hasBuzzed || hasExceededMaxTries || remaining > 0}
          questionType={gq.type as QuestionType}
          compact={compact}
        />
        <BuzzerResetButton
          isDisabled={!hasBuzzed || hasExceededMaxTries}
          questionType={gq.type as QuestionType}
          compact={compact}
        />
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
  questionType: QuestionType;
  compact?: boolean;
}

function BuzzerButton({ isDisabled, questionType, compact = false }: BuzzerButtonProps) {
  const game = useGame();
  const user = useUser();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleBuzz, isBuzzing] = useAsyncAction(async () => {
    await addPlayerToBuzzer(
      questionType,
      game!.id as string,
      currentRound as string,
      game!.currentQuestion as string,
      user?.id as string
    );
  });

  return (
    <Button
      size="large"
      variant="contained"
      color="primary"
      onClick={handleBuzz}
      disabled={isDisabled || isBuzzing}
      style={{ backgroundColor: isDisabled ? 'gray' : 'red' }}
      endIcon={<PanToolIcon fontSize={compact ? 'large' : 'medium'} />}
      sx={compact ? { py: 2, px: 4 } : {}}
    >
      <span className={clsx(compact ? 'text-2xl' : '2xl:text-3xl', !isDisabled && 'text-slate-100')}>BUZZ</span>
    </Button>
  );
}

interface BuzzerResetButtonProps {
  isDisabled: boolean;
  questionType: QuestionType;
  compact?: boolean;
}

function BuzzerResetButton({ isDisabled, questionType, compact = false }: BuzzerResetButtonProps) {
  const game = useGame();
  const user = useUser();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleResetBuzz, isResetting] = useAsyncAction(async () => {
    await removePlayerFromBuzzer(
      questionType,
      game!.id as string,
      currentRound as string,
      game!.currentQuestion as string,
      user?.id as string
    );
  });

  return (
    <Tooltip title="Annuler" placement="right">
      <span>
        <IconButton
          size={compact ? 'large' : 'medium'}
          color="primary"
          aria-label="reset buzzer"
          onClick={handleResetBuzz}
          disabled={isDisabled || isResetting}
        >
          <ReplayIcon fontSize={compact ? 'large' : 'medium'} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
