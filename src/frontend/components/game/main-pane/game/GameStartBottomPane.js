import { startGame } from '@/backend/services/game/actions';

import { ParticipantRole } from '@/backend/models/users/Participant';

import useAsyncAction from '@/frontend/hooks/useAsyncAction';

import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';

import GoGameHomeButton from '@/frontend/components/game/main-pane/GoGameHomeButton';
import TimerPane from '@/frontend/components/game/timer/TimerPane';
import ReadyPlayerController from '@/frontend/components/game/main-pane/ReadyPlayerController';

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

function GameStartController({}) {
  const myRole = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController />
      {myRole === ParticipantRole.ORGANIZER && <GameStartOrganizerController />}
    </div>
  );
}

function GameStartOrganizerController() {
  const game = useGame();

  const [handleStartGame, isStarting] = useAsyncAction(async () => {
    await startGame(game.id);
  });

  return <GoGameHomeButton onClick={handleStartGame} disabled={isStarting} />;
}
