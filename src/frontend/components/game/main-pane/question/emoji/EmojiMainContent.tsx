import NextImage from '@/frontend/components/common/NextImage';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { EmojiQuestion } from '@/models/questions/emoji';

interface EmojiMainContentProps {
  baseQuestion: EmojiQuestion;
}

export default function EmojiMainContent({ baseQuestion }: EmojiMainContentProps) {
  const game = useGame();
  if (!game) return null;

  return (
    <>
      {game.status === GameStatus.QUESTION_ACTIVE && <ActiveEmojiMainContent baseQuestion={baseQuestion} />}
      {game.status === GameStatus.QUESTION_END && <EndedEmojiMainContent baseQuestion={baseQuestion} />}
    </>
  );
}

function ActiveEmojiMainContent({ baseQuestion }: EmojiMainContentProps) {
  return <span className="text-9xl">{baseQuestion.clue}</span>;
}

function EndedEmojiMainContent({ baseQuestion }: EmojiMainContentProps) {
  const { image, title } = baseQuestion.answer ?? {};
  const clue = baseQuestion.clue;

  if (!image) {
    return (
      <div className="flex flex-col h-3/4 max-w-1/2 items-center justify-center space-y-2">
        <span className="text-9xl">{clue}</span>
        <span className="text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <div className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt={title ?? ''} />
      </div>
      <div className="flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2">
        <span className="text-7xl">{clue}</span>
        <span className="text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
      </div>
    </div>
  );
}
