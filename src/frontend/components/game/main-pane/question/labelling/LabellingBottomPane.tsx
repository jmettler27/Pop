import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import LabellingOrganizerController from '@/frontend/components/game/main-pane/question/labelling/LabellingOrganizerController';
import { useQuestionPlayers } from '@/frontend/hooks/firestore/question/useGameBuzzerQuestionHooks';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { LabellingQuestion } from '@/models/questions/labelling';
import { ParticipantRole } from '@/models/users/participant';

interface QuestionPlayersData extends Record<string, unknown> {
  buzzed: string[];
}

export default function LabellingBottomPane({ baseQuestion }: { baseQuestion: LabellingQuestion }) {
  const game = useGame();

  // LABELLING inherits useQuestionPlayers unchanged from GameBuzzerQuestionRepository.
  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    baseQuestion.type,
    game?.id as string,
    game?.currentRound as string
  ) as unknown as GameBuzzerQuestionRepository;

  const {
    data: questionPlayers,
    loading,
    error,
  } = useQuestionPlayers(gameQuestionRepo, game?.currentQuestion as string) as unknown as {
    data: QuestionPlayersData | null;
    loading: boolean;
    error: Error | undefined;
  };

  if (!game) return null;

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
