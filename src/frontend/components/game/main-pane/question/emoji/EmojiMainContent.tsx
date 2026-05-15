import { Box } from '@mui/material';

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
  const bq = baseQuestion as { clue?: string };
  return <span className="text-9xl">{bq.clue}</span>;
}

function EndedEmojiMainContent({ baseQuestion }: EmojiMainContentProps) {
  const bq = baseQuestion as { answer?: { clue?: string; image?: string; title?: string } };
  const { clue, image, title } = bq.answer ?? {};

  if (!image) {
    return (
      <Box className="flex flex-col h-3/4 max-w-1/2 items-center justify-center space-y-2">
        <span className="text-9xl">{clue}</span>
        <span className="text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
      </Box>
    );
  }

  return (
    <Box className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <Box className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt={title ?? ''} />
      </Box>
      <Box className="flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2">
        <span className="text-7xl">{clue}</span>
        <span className="text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
      </Box>
    </Box>
  );
}
