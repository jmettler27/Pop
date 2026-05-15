import MCQMainContent from '@/frontend/components/game/main-pane/question/mcq/MCQMainContent';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameStatus } from '@/models/games/game-status';
import { MCQQuestion } from '@/models/questions/mcq';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

export default function MCQMiddlePane({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  const game = useGame();
  const myRole = useRole();

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[20%] flex flex-col items-center justify-center">
        <MCQHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[60%] w-full flex items-center justify-center">
        <MCQMainContent baseQuestion={baseQuestion} />
      </div>
      <div className="h-[20%] flex items-center justify-center">
        {(game!.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
          <MCQFooter baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}

function MCQHeader({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={40} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
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

function MCQFooter({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  const explanation = baseQuestion.explanation;
  return explanation ? <span className="w-[80%] 2xl:text-2xl text-center">👉 {explanation}</span> : null;
}
