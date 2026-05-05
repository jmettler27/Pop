import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import HowToRegIcon from '@mui/icons-material/HowToReg';
import { Button, CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { ParticipantRole } from '@/backend/models/users/Participant';
import { PlayerStatus } from '@/backend/models/users/Player';
import { setPlayerReady } from '@/backend/services/player/actions';
import { getRandomElement } from '@/backend/utils/arrays';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/utils/defineMessages';
import fmt, { keyChunks } from '@/utils/fmt';

const messages = defineMessages('frontend.game.bottom.ReadyPlayerController', {
  waitingForPlayers: 'Waiting for players...',
  hotForGameStart: 'Ready for <b>starting the game</b>? \uD83E\uDD78',
  hotForRoundStart: 'Ready for <b>the first question</b>? \uD83E\uDD78',
  hotForQuestionEnd: 'Ready for <b>the next question</b>? \uD83E\uDD78',
  hotForQuestionEndLast: 'Ready for <b>the end of the round</b>? \uD83E\uDD78',
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

export default function ReadyPlayerController({ isLastQuestion }) {
  const { id: gameId } = useParams();
  const myRole = useRole();

  const { timerRepo } = useGameRepositories();
  const { timer, timerLoading, timerError } = timerRepo.useTimer(gameId);

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
      {timer.authorized && (
        <>
          <ReadyPlayerHeader isLastQuestion={isLastQuestion} />
          {myRole === ParticipantRole.PLAYER && <ReadyPlayerButton />}
        </>
      )}
    </div>
  );
}

function ReadyPlayerHeader({ isLastQuestion }) {
  const intl = useIntl();
  const game = useGame();
  const myRole = useRole();

  const { readyRepo } = useGameRepositories();
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

  if (ready.numReady === ready.numPlayers) {
    return <span className="2xl:text-4xl">Letzgo! 🚀</span>;
  }

  const b = (chunks) => <strong>{keyChunks(chunks)}</strong>;

  if (myRole === ParticipantRole.PLAYER) {
    const msg =
      game.status === GameStatus.GAME_START
        ? messages.hotForGameStart
        : game.status === GameStatus.ROUND_START
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
      {intl.formatMessage(messages.waitingForPlayers)} ({ready.numReady}/{ready.numPlayers})
    </span>
  );
}

export function ReadyPlayerButton() {
  const intl = useIntl();
  const { id: gameId } = useParams();
  const user = useUser();

  const [handleClickReady, isSubmitting] = useAsyncAction(async () => {
    await setPlayerReady(gameId, user.id);
  });

  const { playerRepo } = useGameRepositories();
  const { player, playerLoading, playerError } = playerRepo.usePlayer(user.id);

  const readyButtonText = useMemo(() => {
    const key = getRandomElement(READY_TEXT_KEYS);
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
