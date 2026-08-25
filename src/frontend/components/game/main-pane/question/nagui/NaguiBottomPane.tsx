'use client';

import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import NaguiOrganizerController from '@/frontend/components/game/main-pane/question/nagui/NaguiOrganizerController';
import NaguiPlayerController from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerController';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import { Chooser } from '@/models/chooser';
import { GameNaguiQuestion } from '@/models/questions/nagui';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

export default function NaguiBottomPane() {
  const gameId = useGameId();
  const { chooser, loading, error } = useChooser(gameId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
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
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const myRole = useRole();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx] ?? '';

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.NAGUI, questionId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
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
