import { Box } from '@mui/material';

import NextImage from '@/frontend/components/common/NextImage';
import { QUESTION_ELEMENT_TO_EMOJI } from '@/frontend/helpers/question';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameStatus } from '@/models/games/GameStatus';
import { ParticipantRole } from '@/models/users/Participant';

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
  const game = useGame();
  const myRole = useRole();

  if (game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) {
    return <span className="text-green-500">{element}</span>;
  }

  return <span className="text-yellow-500">???</span>;
};
