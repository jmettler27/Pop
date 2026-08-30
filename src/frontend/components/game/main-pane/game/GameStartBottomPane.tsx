import { updateGame } from '@/frontend/api';
import GoGameHomeButton from '@/frontend/components/game/main-pane/GoGameHomeButton';
import ReadyPlayerController from '@/frontend/components/game/main-pane/ReadyPlayerController';
import TimerPane from '@/frontend/components/game/timer/TimerPane';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import { ParticipantRole } from '@/models/users/participant';

export default function GameStartBottomPane() {
  return (
    <div className="flex flex-row h-full items-center justify-center divide-x divide-solid">
      <div className="flex flex-col h-full w-1/5 items-center justify-center">
        <TimerPane />
      </div>

      <div className="flex flex-col h-full w-4/5 items-center justify-center">
        <GameStartController />
      </div>
    </div>
  );
}

function GameStartController() {
  const role = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController />
      {role === ParticipantRole.ORGANIZER && <GameStartOrganizerController />}
    </div>
  );
}

function GameStartOrganizerController() {
  const gameId = useGameId();

  const [handleStartGame, isStarting] = useAsyncAction(async () => {
    await updateGame(gameId, { action: 'start' });
  });

  return <GoGameHomeButton onClick={handleStartGame} disabled={isStarting} />;
}
