import { clsx } from 'clsx';

import BlindtestMainContent from '@/frontend/components/game/main-pane/question/blindtest/BlindtestMainContent';
import BuzzerAnswer from '@/frontend/components/game/main-pane/question/buzzer/BuzzerAnswer';
import EmojiMainContent from '@/frontend/components/game/main-pane/question/emoji/EmojiMainContent';
import ImageMainContent from '@/frontend/components/game/main-pane/question/image/ImageMainContent';
import ProgressiveCluesMainContent from '@/frontend/components/game/main-pane/question/progressive-clues/ProgressiveCluesMainContent';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameStatus } from '@/models/games/game-status';
import { BlindtestQuestion } from '@/models/questions/blindtest';
import { BuzzerQuestion } from '@/models/questions/buzzer';
import { EmojiQuestion } from '@/models/questions/emoji';
import { ImageQuestion } from '@/models/questions/image';
import { ProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { QuestionType, questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

interface BuzzerMiddlePaneProps {
  baseQuestion: BuzzerQuestion;
}

export default function BuzzerMiddlePane({ baseQuestion }: BuzzerMiddlePaneProps) {
  const myRole = useRole();
  const game = useGame();
  if (!game) return null;

  const showAnswer = game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER;

  return (
    <div className={clsx('flex flex-col h-full items-center')}>
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

function BuzzerQuestionHeader({ baseQuestion }: BuzzerMiddlePaneProps) {
  const bq = baseQuestion as { type?: QuestionType; topic?: string; title?: string };
  return (
    <div className="flex flex-col items-center justify-around">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={bq.type as QuestionType} fontSize={40} />
        <h1 className="2xl:text-5xl">
          {bq.topic ? topicToEmoji(bq.topic as Topic) : ''}{' '}
          <strong>
            {questionTypeToTitle(bq.type as QuestionType)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-5xl">{bq.title}</h2>
      </div>
    </div>
  );
}

interface BuzzerMainContentProps {
  baseQuestion: BuzzerQuestion;
  showComplete: boolean;
}

function BuzzerMainContent({ baseQuestion, showComplete }: BuzzerMainContentProps) {
  const bq = baseQuestion as { type?: QuestionType };
  switch (bq.type) {
    case QuestionType.PROGRESSIVE_CLUES:
      return (
        <ProgressiveCluesMainContent
          baseQuestion={baseQuestion as ProgressiveCluesQuestion}
          showComplete={showComplete}
        />
      );
    case QuestionType.IMAGE:
      return <ImageMainContent baseQuestion={baseQuestion as ImageQuestion} />;
    case QuestionType.BLINDTEST:
      return <BlindtestMainContent baseQuestion={baseQuestion as BlindtestQuestion} />;
    case QuestionType.EMOJI:
      return <EmojiMainContent baseQuestion={baseQuestion as EmojiQuestion} />;
    default:
      return <p>Unknown round type</p>;
  }
}
