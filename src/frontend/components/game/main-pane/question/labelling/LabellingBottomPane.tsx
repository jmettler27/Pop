import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import LabellingOrganizerController from '@/frontend/components/game/main-pane/question/labelling/LabellingOrganizerController';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameRounds } from '@/models/games/game';
import { LabellingQuestion } from '@/models/questions/labelling';
import { ParticipantRole } from '@/models/users/participant';

interface QuestionPlayersData extends Record<string, unknown> {
  buzzed: string[];
}

export default function LabellingBottomPane({ baseQuestion }: { baseQuestion: LabellingQuestion }) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    baseQuestion.type,
    game.id as string,
    game.currentRound as string
  ) as unknown as {
    useQuestionPlayers: (id: string) => {
      data: QuestionPlayersData | null;
      loading: boolean;
      error: Error | undefined;
    };
  };

  const { data: questionPlayers, loading, error } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion as string);

  if (error || loading || !questionPlayers) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <LabellingController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

interface LabellingControllerProps {
  baseQuestion: LabellingQuestion;
  questionPlayers: QuestionPlayersData;
}

function LabellingController({ baseQuestion, questionPlayers }: LabellingControllerProps) {
  const myRole = useRole();

  switch (myRole) {
    case ParticipantRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case ParticipantRole.ORGANIZER:
      return <LabellingOrganizerController questionPlayers={questionPlayers} baseQuestion={baseQuestion} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
