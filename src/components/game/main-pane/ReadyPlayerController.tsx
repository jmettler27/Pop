import { useMemo, type ReactNode } from 'react';

import { UserCheck } from 'lucide-react';
import { useIntl } from 'react-intl';

import { updatePlayer } from '@/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getRandomElement } from '@/helpers/arrays';
import fmt, { keyChunks } from '@/helpers/fmt';
import { useTimer } from '@/hooks/firestore/timer/useTimerHooks';
import { usePlayer } from '@/hooks/firestore/user/usePlayerHooks';
import { useReady } from '@/hooks/firestore/user/useReadyHooks';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGame from '@/hooks/useGame';
import useGameId from '@/hooks/useGameId';
import useRole from '@/hooks/useRole';
import useUser from '@/hooks/useUser';
import defineMessages from '@/i18n/defineMessages';
import { GameStatus } from '@/models/games/game-status';
import { ParticipantRole } from '@/models/users/participant';
import { PlayerStatus } from '@/models/users/player';

const messages = defineMessages('frontend.game.bottom.ReadyPlayerController', {
  waitingForPlayers: 'Waiting for players...',
  hotForGameStart: 'Ready for <b>starting the game</b>? 🥸',
  hotForRoundStart: 'Ready for <b>the first question</b>? 🥸',
  hotForQuestionEnd: 'Ready for <b>the next question</b>? 🥸',
  hotForQuestionEndLast: 'Ready for <b>the end of the round</b>? 🥸',
  readyText1: "Let's do this like a boss",
  readyText2: "I'm geared up and ready to roll",
  readyText3: 'My body is primed and pumped',
  readyText4: "I'm prepped like a pro",
  readyText5: 'My engines are revved and ready to go',
  readyText6: "I'm itching to get started",
  readyText7: "I'm fired up and good to go",
  readyText8: "I'm locked and loaded for action",
  readyText9: "I'm amped up and raring to go",
  readyText10: 'My batteries are fully charged',
  readyText11: "I'm chomping at the bit",
  readyText12: "I'm all set and ready to rock",
  readyText13: "I'm hyped up and ready to go",
  readyText14: "I'm ready to take on the world",
  readyText15: "Let's get this party started",
  readyText16: "I'm in the zone and ready to dominate",
  readyText17: "I'm all systems go",
  readyText18: "I'm like a coiled spring, ready to unleash",
  readyText19: "I'm prepped and pumped like a prizefighter",
  readyText20: "I'm armed and dangerous, ready to tackle whatever comes my way",
});

const READY_TEXT_KEYS = [
  'readyText1',
  'readyText2',
  'readyText3',
  'readyText4',
  'readyText5',
  'readyText6',
  'readyText7',
  'readyText8',
  'readyText9',
  'readyText10',
  'readyText11',
  'readyText12',
  'readyText13',
  'readyText14',
  'readyText15',
  'readyText16',
  'readyText17',
  'readyText18',
  'readyText19',
  'readyText20',
];

interface ReadyPlayerControllerProps {
  isLastQuestion?: boolean;
}

export default function ReadyPlayerController({ isLastQuestion }: ReadyPlayerControllerProps) {
  const gameId = useGameId();
  const role = useRole();

  const { timer, timerLoading, timerError } = useTimer(gameId);

  if (timerError) {
    return <></>;
  }
  if (timerLoading) {
    return <Spinner />;
  }
  if (!timer) {
    return <></>;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-5">
      {timer.authorized && (
        <>
          <ReadyPlayerHeader isLastQuestion={isLastQuestion} />
          {role === ParticipantRole.PLAYER && <ReadyPlayerButton />}
        </>
      )}
    </div>
  );
}

interface ReadyPlayerHeaderProps {
  isLastQuestion?: boolean;
}

function ReadyPlayerHeader({ isLastQuestion }: ReadyPlayerHeaderProps) {
  const intl = useIntl();
  const game = useGame();
  const role = useRole();

  const { ready, readyLoading, readyError } = useReady(game?.id ?? null);
  if (!game) return null;

  if (readyError) {
    return <></>;
  }
  if (readyLoading) {
    return <Spinner />;
  }
  if (!ready) {
    return <></>;
  }

  if ((ready as { numReady?: number }).numReady === (ready as { numPlayers?: number }).numPlayers) {
    return <span className="text-center text-xl 2xl:text-3xl">Letzgo! 🚀</span>;
  }

  const b = (chunks: ReactNode[]) => <strong>{keyChunks(chunks)}</strong>;

  if (role === ParticipantRole.PLAYER) {
    const msg =
      game!.status === GameStatus.GAME_START
        ? messages.hotForGameStart
        : game!.status === GameStatus.ROUND_START
          ? messages.hotForRoundStart
          : isLastQuestion
            ? messages.hotForQuestionEndLast
            : messages.hotForQuestionEnd;
    if (msg) {
      return <span className="text-center text-xl 2xl:text-3xl">{fmt(intl.formatMessage, msg, { b })}</span>;
    }
  }

  return (
    <span className="text-center text-xl 2xl:text-3xl">
      {intl.formatMessage(messages.waitingForPlayers)} ({(ready as { numReady?: number }).numReady}/
      {(ready as { numPlayers?: number }).numPlayers})
    </span>
  );
}

export function ReadyPlayerButton() {
  const intl = useIntl();
  const gameId = useGameId();
  const user = useUser();

  const [handleClickReady, isSubmitting] = useAsyncAction(async () => {
    await updatePlayer(gameId as string, user?.id as string, { action: 'ready' });
  });

  const readyButtonText = useMemo(() => {
    const key = getRandomElement(READY_TEXT_KEYS) as keyof typeof messages;
    return intl.formatMessage(messages[key]);
  }, [intl]);

  const { player, loading: playerLoading, error: playerError } = usePlayer(gameId, user?.id as string);

  if (playerError) {
    return <></>;
  }
  if (playerLoading) {
    return <Spinner />;
  }
  if (!player) {
    return <></>;
  }

  return (
    <Button
      className="rounded-full"
      variant="secondary"
      size="lg"
      onClick={handleClickReady}
      disabled={player.status === PlayerStatus.READY || isSubmitting}
    >
      <UserCheck className="mr-2 size-4" />
      {readyButtonText}
    </Button>
  );
}
