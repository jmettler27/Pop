import PanToolIcon from '@mui/icons-material/PanTool';
import ReplayIcon from '@mui/icons-material/Replay';
import { Button, IconButton, Tooltip } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';
import { addPlayerToBuzzer, removePlayerFromBuzzer } from '@/backend/services/question/basic/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { QuestionType } from '@/models/questions/question-type';
import { type AnyRound } from '@/models/rounds/RoundFactory';
import { PlayerStatus } from '@/models/users/player';

interface BasicPlayers {
  buzzed: string[];
  canceled: { playerId: string; [key: string]: unknown }[];
  [key: string]: unknown;
}

interface BasicPlayerControllerProps {
  players: BasicPlayers;
}

export default function BasicPlayerController({ players: basicPlayers }: BasicPlayerControllerProps) {
  const game = useGame();
  if (!game) return null;
  const user = useUser();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo, roundRepo } = gameRepositories;

  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const gameQuestionRepo = new GameBasicQuestionRepository(game.id as string, currentRound as string);

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

  const { buzzed, canceled } = basicPlayers;

  const hasBuzzed = buzzed.includes(user?.id as string);
  const isFirst = hasBuzzed && buzzed[0] === user?.id;

  const myCanceledItems = canceled.filter((item) => item.playerId === user?.id);
  const hasExceededMaxTries =
    myCanceledItems && myCanceledItems.length >= ((round as unknown as { maxTries?: number }).maxTries ?? 0);
  const remaining = 0; // placeholder - value comes from parent context

  return (
    <div className="flex flex-col h-full items-center justify-around">
      <BuzzerMessage
        playerStatus={player.status}
        hasExceededMaxTries={hasExceededMaxTries}
        round={round}
        myCanceledItems={myCanceledItems}
        isFirst={isFirst}
        hasBuzzed={hasBuzzed}
        remaining={remaining}
      />
      <div className="flex flex-row w-full justify-center">
        <BuzzerButton isDisabled={hasBuzzed || hasExceededMaxTries} />
        <BuzzerResetButton isDisabled={!hasBuzzed || hasExceededMaxTries} />
      </div>
    </div>
  );
}

interface BuzzerMessageProps {
  playerStatus: string | undefined;
  hasExceededMaxTries: boolean;
  round: AnyRound;
  myCanceledItems: { playerId: string; [key: string]: unknown }[];
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
  const r = round as unknown as { maxTries?: number; type?: string; delay?: number };
  const intl = useIntl();
  if (hasExceededMaxTries)
    return (
      <span className="2xl:text-3xl text-red-500">
        🤐 {intl.formatMessage(globalMessages.maxTriesExceeded)} ({r.maxTries})
      </span>
    );

  if (playerStatus === PlayerStatus.WRONG) {
    const message = intl.formatMessage(globalMessages.wrongAnswer);
    if (r.type === QuestionType.PROGRESSIVE_CLUES && r.delay && r.delay > 0) {
      return (
        <span className="2xl:text-3xl">
          {message} {intl.formatMessage(globalMessages.buzzAgain)}{' '}
          <span className="font-bold text-blue-500">
            {remaining > 1 ? numRemainingClues(remaining, intl.locale) : intl.formatMessage(globalMessages.nextClue)}.
          </span>
        </span>
      );
    }
    return <span className="2xl:text-3xl text-red-500">{message}</span>;
  }
  if (isFirst) {
    const message = `${intl.formatMessage(globalMessages.firstBuzzer)} 🧐`;
    if (myCanceledItems.length === (r.maxTries ?? 0) - 1)
      return (
        <span className="2xl:text-3xl">
          {message}. <span className="text-red-500">{intl.formatMessage(globalMessages.lastAttempt)}</span>
        </span>
      );
    return <span className="2xl:text-3xl">{message}</span>;
  }
  if (hasBuzzed) return <span className="2xl:text-3xl">{intl.formatMessage(globalMessages.waitForTurn)}</span>;
  return <span className="2xl:text-3xl">{intl.formatMessage(globalMessages.anyIdea)} 🤔</span>;
}

function numRemainingClues(remaining: number, _locale: string): string {
  return `${remaining}`;
}

interface BuzzerButtonProps {
  isDisabled: boolean;
}

function BuzzerButton({ isDisabled }: BuzzerButtonProps) {
  const game = useGame();
  const user = useUser();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleBuzz, isBuzzing] = useAsyncAction(async () => {
    await addPlayerToBuzzer(
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
      endIcon={<PanToolIcon />}
    >
      <span className={clsx('2xl:text-3xl', !isDisabled && 'text-slate-100')}>BUZZ</span>
    </Button>
  );
}

interface BuzzerResetButtonProps {
  isDisabled: boolean;
}

function BuzzerResetButton({ isDisabled }: BuzzerResetButtonProps) {
  const game = useGame();
  const user = useUser();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleResetBuzz, isResetting] = useAsyncAction(async () => {
    await removePlayerFromBuzzer(
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
          color="primary"
          aria-label="reset buzzer"
          onClick={handleResetBuzz}
          disabled={isDisabled || isResetting}
        >
          <ReplayIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
