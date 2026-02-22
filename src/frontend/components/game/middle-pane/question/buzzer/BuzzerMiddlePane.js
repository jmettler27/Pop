import { QuestionTypeIcon } from '@/backend/utils/question_types';

import { topicToEmoji } from '@/backend/models/Topic';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { UserRole } from '@/backend/models/users/User';
import { QuestionType, questionTypeToTitle } from '@/backend/models/questions/QuestionType';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader';
import BuzzerMainContent from '@/frontend/components/game/middle-pane/question/buzzer/BuzzerMainContent';
import BuzzerAnswer from '@/frontend/components/game/middle-pane/question/buzzer/BuzzerAnswer';

import { clsx } from 'clsx';

export default function BuzzerMiddlePane({ baseQuestion }) {
  const myRole = useRoleContext();
  const game = useGameContext();

  const showAnswer = game.status === GameStatus.QUESTION_END || myRole === UserRole.ORGANIZER;

  return (
    <div
      className={clsx(
        'flex flex-col h-full items-center'
        // question.type === QuestionType.PROGRESSIVE_CLUES && 'bg-progressive-clues',
      )}
    >
      <div className="flex h-[20%]">
        <BuzzerQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="flex h-[70%] w-full items-center justify-center">
        <BuzzerMainContent baseQuestion={baseQuestion} showComplete={showAnswer} />
      </div>
      <div className="flex h-[10%]">{showAnswer && <BuzzerAnswer baseQuestion={baseQuestion} />}</div>
    </div>
  );
}

function BuzzerQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-around">
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
        <h2 className="2xl:text-5xl">{baseQuestion.title}</h2>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
        <h1 className="2xl:text-5xl">
          {baseQuestion.type === 'blindtest' && BlindtestQuestion.typeToEmoji(baseQuestion.subtype)}
          {topicToEmoji(baseQuestion.topic)}{' '}
          <strong>
            {QuestionType.typeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <h2 className="2xl:text-4xl">{baseQuestion.title}</h2>
    </div>
  );
}
