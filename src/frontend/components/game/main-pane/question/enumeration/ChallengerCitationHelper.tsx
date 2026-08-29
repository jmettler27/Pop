import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import clsx from 'clsx';

import ValidateChallengerCitationButton from '@/frontend/components/game/main-pane/question/enumeration/ValidateChallengerCitationButton';
import { ProgressIndicator, ProgressTrack } from '@/frontend/components/ui/progress';
import { useQuestionPlayers } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { usePlayer } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import { ParticipantRole } from '@/models/users/participant';

interface Challenger {
  playerId: string;
  numCorrect: number;
  bet: number;
  cited: Record<string, unknown>;
}

export default function ChallengerCitationHelper() {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = useQuestionPlayers(gameId, roundId, questionId);

  if (playersError || playersLoading || !questionPlayers) {
    return <></>;
  }

  const { challenger } = questionPlayers as unknown as { challenger: Challenger };

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <ChallengerName challengerId={challenger.playerId} />
      <ChallengerProgress challenger={challenger} />
    </div>
  );
}

function ChallengerName({ challengerId }: { challengerId: string }) {
  const gameId = useGameId();
  const { player, loading: playerLoading, error: playerError } = usePlayer(gameId, challengerId);

  if (playerError || playerLoading || !player) {
    return <></>;
  }

  return <span className="2xl:text-3xl font-bold">{player.name}</span>;
}

const progressToSmiley: Record<number, string> = {
  0: '😐',
  10: '🙂',
  20: '😄',
  30: '😀',
  40: '😁',
  50: '😃',
  60: '😄',
  70: '😆',
  80: '🤩',
  90: '😍',
  100: '🥳',
};

const progressToBarColor: Record<number, string> = {
  0: '#FF0000',
  10: '#FF3300',
  20: '#FF6600',
  30: '#FF9900',
  40: '#FFCC00',
  50: '#FFFF00',
  60: '#CCFF00',
  70: '#99FF00',
  80: '#66FF00',
  90: '#33FF00',
  100: '#00FF00',
};

function ChallengerProgress({ challenger }: { challenger: Challenger }) {
  const role = useRole();

  const percentage = (challenger.numCorrect * 100) / challenger.bet;
  const cappedPercentage = Math.min(percentage, 100);
  const roundedDownToNearestTen = Math.floor(cappedPercentage / 10) * 10;

  return (
    <div className="flex flex-row w-full items-center justify-center space-x-4">
      <h5 className="text-2xl">{progressToSmiley[roundedDownToNearestTen]}</h5>

      <ProgressPrimitive.Root value={cappedPercentage} className="w-1/2">
        <ProgressTrack className="h-3">
          <ProgressIndicator style={{ backgroundColor: progressToBarColor[roundedDownToNearestTen] }} />
        </ProgressTrack>
      </ProgressPrimitive.Root>

      <h5 className={clsx('text-2xl', challenger.numCorrect >= challenger.bet && 'text-green-500')}>
        {challenger.numCorrect}/<strong>{challenger.bet}</strong>
      </h5>

      {role === ParticipantRole.ORGANIZER && <ValidateChallengerCitationButton />}
    </div>
  );
}
