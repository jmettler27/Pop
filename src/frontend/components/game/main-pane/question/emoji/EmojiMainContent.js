import { Box } from '@mui/material';

import NextImage from '@/frontend/components/common/NextImage';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/GameStatus';

export default function EmojiMainContent({ baseQuestion }) {
  const game = useGame();

  return (
    <>
      {game.status === GameStatus.QUESTION_ACTIVE && <ActiveEmojiMainContent baseQuestion={baseQuestion} />}
      {game.status === GameStatus.QUESTION_END && <EndedEmojiMainContent baseQuestion={baseQuestion} />}
    </>
  );
}

function ActiveEmojiMainContent({ baseQuestion }) {
  return <span className="text-9xl">{baseQuestion.clue}</span>;
}

function EndedEmojiMainContent({ baseQuestion }) {
  const { clue, image, title } = baseQuestion.answer;

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
        <NextImage url={image} alt={title} />
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
