'use client';

import { CircularProgress } from '@mui/material';

import GameNaguiQuestionRepository from '@/backend/repositories/question/GameNaguiQuestionRepository';
import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import NaguiOrganizerController from '@/frontend/components/game/main-pane/question/nagui/NaguiOrganizerController';
import NaguiPlayerController from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerController';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import type { GameRounds } from '@/models/games/game';
import { GameNaguiQuestion } from '@/models/questions/nagui';
import { ParticipantRole } from '@/models/users/participant';

interface Chooser {
  chooserOrder: string[];
  chooserIdx: number;
}

export default function NaguiBottomPane() {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { chooserRepo } = gameRepositories;
  const { chooser, loading, error } = chooserRepo.useChooser();

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!chooser) {
    return <></>;
  }

  const chooserData = chooser as unknown as Chooser;

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4">
        <NaguiController chooser={chooserData} />
      </div>

      {/* Right part: list of buzzer players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooserData} />
      </div>
    </div>
  );
}

function NaguiController({ chooser }: { chooser: Chooser }) {
  const game = useGame();
  if (!game) return null;
  const myRole = useRole();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx] ?? '';

  const gameQuestionRepo = new GameNaguiQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const gameQuestionData = gameQuestion as unknown as GameNaguiQuestion;

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <NaguiOrganizerController gameQuestion={gameQuestionData} />;
    case ParticipantRole.PLAYER:
      return <NaguiPlayerController chooserTeamId={chooserTeamId} gameQuestion={gameQuestionData} />;
    default:
      return <NaguiSpectatorController chooserTeamId={chooserTeamId} gameQuestion={gameQuestionData} />;
  }
}

interface NaguiSpectatorControllerProps {
  chooserTeamId: string;
  gameQuestion: GameNaguiQuestion;
}

function NaguiSpectatorController({ chooserTeamId, gameQuestion }: NaguiSpectatorControllerProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      {gameQuestion.option === null && (
        <span className="2xl:text-4xl font-bold">
          <GameChooserHelperText chooserTeamId={chooserTeamId} />
        </span>
      )}
      {gameQuestion.option !== null && (
        <span className="2xl:text-4xl font-bold">
          <NaguiPlayerOptionHelperText gameQuestion={gameQuestion} />
        </span>
      )}
    </div>
  );
}
