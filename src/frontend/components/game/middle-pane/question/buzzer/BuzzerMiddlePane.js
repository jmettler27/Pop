import { QuestionTypeIcon } from '@/backend/utils/question_types';

import { topicToEmoji } from '@/backend/models/Topic';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { ParticipantRole } from '@/backend/models/users/Participant';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { QuestionType } from '@/backend/models/questions/QuestionType';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import ProgressiveCluesMainContent from '@/frontend/components/game/middle-pane/question/progressive-clues/ProgressiveCluesMainContent';
import ImageMainContent from '@/frontend/components/game/middle-pane/question/image/ImageMainContent';
import BlindtestMainContent from '@/frontend/components/game/middle-pane/question/blindtest/BlindtestMainContent';
import EmojiMainContent from '@/frontend/components/game/middle-pane/question/emoji/EmojiMainContent';
import CurrentRoundQuestionOrder from '@/frontend/components/game/middle-pane/question/QuestionHeader';
import BuzzerAnswer from '@/frontend/components/game/middle-pane/question/buzzer/BuzzerAnswer';

import { clsx } from 'clsx';

export default function BuzzerMiddlePane({ baseQuestion }) {
  const myRole = useRoleContext();
  const game = useGameContext();

  const showAnswer = game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER;

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
}

function BuzzerMainContent({ baseQuestion, showComplete }) {
  switch (baseQuestion.type) {
    case QuestionType.PROGRESSIVE_CLUES:
      return <ProgressiveCluesMainContent baseQuestion={baseQuestion} showComplete={showComplete} />;
    case QuestionType.IMAGE:
      return <ImageMainContent baseQuestion={baseQuestion} />;
    case QuestionType.BLINDTEST:
      return <BlindtestMainContent baseQuestion={baseQuestion} />;
    case QuestionType.EMOJI:
      return <EmojiMainContent baseQuestion={baseQuestion} />;
    default:
      return <p>Unknown round type</p>;
  }
}
