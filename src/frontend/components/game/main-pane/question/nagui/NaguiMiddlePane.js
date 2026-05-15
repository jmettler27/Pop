import NaguiMainContent from '@/frontend/components/game/main-pane/question/nagui/NaguiMainContent';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameStatus } from '@/models/games/GameStatus';
import { questionTypeToTitle } from '@/models/questions/QuestionType';
import { topicToEmoji } from '@/models/Topic';
import { ParticipantRole } from '@/models/users/Participant';

export default function NaguiMiddlePane({ baseQuestion }) {
  const game = useGame();
  const myRole = useRole();

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[10%] flex flex-col items-center justify-center">
        <NaguiHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[70%] w-full flex items-center justify-center">
        <NaguiMainContent baseQuestion={baseQuestion} />
      </div>
      <div className="h-[20%] flex items-center justify-center">
        {(game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
          <NaguiFooter baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}

function NaguiHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={40} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-5xl italic">{baseQuestion.source}</h2>
      </div>
    </div>
  );
}

function NaguiFooter({ baseQuestion }) {
  const explanation = baseQuestion.explanation;
  return explanation && <span className="w-[80%] 2xl:text-xl text-center">👉 {explanation}</span>;
}
