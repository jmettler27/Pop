import { setPlayerReady } from '@/backend/services/player/actions';

import { getRandomElement } from '@/backend/utils/arrays';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { ParticipantRole } from '@/backend/models/users/Participant';

import { useGameContext, useGameRepositoriesContext, useRoleContext, useUserContext } from '@/frontend/contexts';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.ReadyPlayerController', {
  waitingForPlayers: 'Waiting for players...',
  hotFor: 'Ready for',
  gameStart: 'starting the game',
  roundStart: 'the first question',
  questionEnd: 'the next question',
  questionEndLast: 'the end of the round',
});

import { useParams } from 'next/navigation';

import { Button, CircularProgress } from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { PlayerStatus } from '@/backend/models/users/Player';

export default function ReadyPlayerController({ isLastQuestion }) {
  const { id: gameId } = useParams();
  const myRole = useRoleContext();

  const { timerRepo } = useGameRepositoriesContext();
  const { timer, timerLoading, timerError } = timerRepo.useTimer(gameId);

  if (timerError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(timerError)}</strong>
      </p>
    );
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
  const game = useGameContext();
  const myRole = useRoleContext();

  const { readyRepo } = useGameRepositoriesContext();
  const { ready, readyLoading, readyError } = readyRepo.useReady();

  if (readyError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(readyError)}</strong>
      </p>
    );
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

  if (myRole === ParticipantRole.PLAYER) {
    switch (game.status) {
      case GameStatus.GAME_START:
        return (
          <span className="2xl:text-4xl">
            {intl.formatMessage(messages.hotFor)} <strong>{intl.formatMessage(messages.gameStart)}</strong>? 🥸
          </span>
        );
      case GameStatus.ROUND_START:
        return (
          <span className="2xl:text-4xl">
            {intl.formatMessage(messages.hotFor)} <strong>{intl.formatMessage(messages.roundStart)}</strong>? 🥸
          </span>
        );
      case GameStatus.QUESTION_END:
        return (
          <span className="2xl:text-4xl">
            {intl.formatMessage(messages.hotFor)}{' '}
            <strong>
              {isLastQuestion ? intl.formatMessage(messages.questionEndLast) : intl.formatMessage(messages.questionEnd)}
            </strong>
            ? 🥸
          </span>
        );
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
  const user = useUserContext();

  const [handleClickReady, isSubmitting] = useAsyncAction(async () => {
    await setPlayerReady(gameId, user.id);
  });

  const { playerRepo } = useGameRepositoriesContext();
  const { player, playerLoading, playerError } = playerRepo.usePlayer(user.id);

  if (playerError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(playerError)}</strong>
      </p>
    );
  }
  if (playerLoading) {
    return <CircularProgress />;
  }
  if (!player) {
    return <></>;
  }

  const readyButtonText =
    intl.locale === 'fr' ? getRandomElement(READY_BUTTON_TEXT_FR) : getRandomElement(READY_BUTTON_TEXT_EN);

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

// Taken from https://responsefully.com/funny-ways-to-say-im-ready/
const READY_BUTTON_TEXT_EN = [
  "Let's do this like a boss",
  "I'm geared up and ready to roll",
  'My body is primed and pumped',
  "I'm prepped like a pro",
  'My engines are revved and ready to go',
  "I'm itching to get started",
  "I'm fired up and good to go",
  "I'm locked and loaded for action",
  "I'm amped up and raring to go",
  'My batteries are fully charged',
  "I'm chomping at the bit",
  "I'm all set and ready to rock",
  "I'm hyped up and ready to go",
  "I'm ready to take on the world",
  "Let's get this party started",
  "I'm in the zone and ready to dominate",
  "I'm all systems go",
  "I'm like a coiled spring, ready to unleash",
  "I'm prepped and pumped like a prizefighter",
  "I'm armed and dangerous, ready to tackle whatever comes my way",
];

const READY_BUTTON_TEXT_FR = [
  'Chui prêt',
  'Je suis prêt comme un ninja devant un buffet!',
  'Prêt à décoller comme une fusée en chocolat!',
  'Je suis prêt à affronter les licornes et les dragons!',
  'Prêt comme un écureuil devant une noisette!',
  'Je suis prêt à dévorer les énigmes comme un détective affamé!',
  'Prêt à rouler comme une boule de neige en descente!',
  'Je suis prêt à briller comme une étoile du rire!',
  "Prêt à plonger dans l'inconnu comme un explorateur de canapé!",
  'Je suis prêt comme un chat à la chasse aux souris!',
  "Prêt à déguster les défis comme un chef étoilé de l'aventure!",
  'Je suis prêt à bondir comme un kangourou en pleine forme!',
  "Prêt à m'envoler comme un oiseau de nuit!",
];
