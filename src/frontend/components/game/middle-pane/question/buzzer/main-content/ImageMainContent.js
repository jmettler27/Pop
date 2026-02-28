import { GameStatus } from '@/backend/models/games/GameStatus';
import { UserRole } from '@/backend/models/users/User';
import { QUESTION_ELEMENT_TO_EMOJI } from '@/backend/utils/question/question';

import { useGameContext, useRoleContext } from '@/frontend/contexts';
import { Box } from '@mui/material';
import NextImage from '@/frontend/components/game/NextImage';

export default function ImageMainContent({ baseQuestion }) {
  const image = baseQuestion.image;
  const answer = baseQuestion.answer;
  const description = answer.description;
  const source = answer.source;

  return (
    <Box className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <Box className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt="???" />
      </Box>
      <Box className="flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2">
        {description && (
          <span className="2xl:text-4xl dark:text-white">
            {QUESTION_ELEMENT_TO_EMOJI['description']} {<DisplayedImageElement element={description} />}
          </span>
        )}
        {source && (
          <span className="2xl:text-4xl dark:text-white">
            {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{<DisplayedImageElement element={source} />}</i>
          </span>
        )}
      </Box>
    </Box>
  );
}

const DisplayedImageElement = ({ element }) => {
  const game = useGameContext();
  const myRole = useRoleContext();

  if (game.status === GameStatus.QUESTION_END || myRole === UserRole.ORGANIZER) {
    return <span className="text-green-500">{element}</span>;
  }

  return <span className="text-yellow-500">???</span>;
};
