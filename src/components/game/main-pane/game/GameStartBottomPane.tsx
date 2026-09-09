import { GAME_ACTIONS, updateGame } from '@/api';
import GoGameHomeButton from '@/components/game/main-pane/GoGameHomeButton';
import ReadyPlayerController from '@/components/game/main-pane/ReadyPlayerController';
import TimerPane from '@/components/game/timer/TimerPane';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
import useRole from '@/hooks/useRole';
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
    await updateGame(gameId, { action: GAME_ACTIONS.Start });
  });

  return <GoGameHomeButton onClick={handleStartGame} disabled={isStarting} />;
}
