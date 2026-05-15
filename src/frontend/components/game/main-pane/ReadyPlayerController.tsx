import { useMemo, type ReactNode } from 'react';
import { useParams } from 'next/navigation';

import HowToRegIcon from '@mui/icons-material/HowToReg';
import { Button, CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';

import { setPlayerReady } from '@/backend/services/player/actions';
import { getRandomElement } from '@/backend/utils/arrays';
import fmt, { keyChunks } from '@/frontend/helpers/fmt';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
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
  const { id } = useParams();
  const gameId = id as string;
  const myRole = useRole();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { timerRepo } = gameRepositories;
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (timerError) {
    return <></>;
  }
  if (timerLoading) {
    return <CircularProgress />;
  }
  if (!timer) {
    return <></>;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-5">
      {(timer as { authorized?: boolean }).authorized && (
        <>
          <ReadyPlayerHeader isLastQuestion={isLastQuestion} />
          {myRole === ParticipantRole.PLAYER && <ReadyPlayerButton />}
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
  const myRole = useRole();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { readyRepo } = gameRepositories;
  const { ready, readyLoading, readyError } = readyRepo.useReady();

  if (readyError) {
    return <></>;
  }
  if (readyLoading) {
    return <CircularProgress />;
  }
  if (!ready) {
    return <></>;
  }

  if ((ready as { numReady?: number }).numReady === (ready as { numPlayers?: number }).numPlayers) {
    return <span className="2xl:text-4xl">Letzgo! 🚀</span>;
  }

  const b = (chunks: ReactNode[]) => <strong>{keyChunks(chunks)}</strong>;

  if (myRole === ParticipantRole.PLAYER) {
    const msg =
      game!.status === GameStatus.GAME_START
        ? messages.hotForGameStart
        : game!.status === GameStatus.ROUND_START
          ? messages.hotForRoundStart
          : isLastQuestion
            ? messages.hotForQuestionEndLast
            : messages.hotForQuestionEnd;
    if (msg) {
      return <span className="2xl:text-4xl">{fmt(intl.formatMessage, msg, { b })}</span>;
    }
  }

  return (
    <span className="2xl:text-4xl">
      {intl.formatMessage(messages.waitingForPlayers)} ({(ready as { numReady?: number }).numReady}/
      {(ready as { numPlayers?: number }).numPlayers})
    </span>
  );
}

export function ReadyPlayerButton() {
  const intl = useIntl();
  const { id } = useParams();
  const gameId = id as string;
  const user = useUser();

  const [handleClickReady, isSubmitting] = useAsyncAction(async () => {
    await setPlayerReady(gameId as string, user?.id as string);
  });

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo } = gameRepositories;
  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayer(user?.id as string);

  const readyButtonText = useMemo(() => {
    const key = getRandomElement(READY_TEXT_KEYS) as keyof typeof messages;
    return intl.formatMessage(messages[key]);
  }, [intl]);

  if (playerError) {
    return <></>;
  }
  if (playerLoading) {
    return <CircularProgress />;
  }
  if (!player) {
    return <></>;
  }

  return (
    <Button
      className="rounded-full"
      color="secondary"
      size="large"
      variant="contained"
      onClick={handleClickReady}
      disabled={player.status === PlayerStatus.READY || isSubmitting}
      startIcon={<HowToRegIcon />}
    >
      {readyButtonText}
    </Button>
  );
}
