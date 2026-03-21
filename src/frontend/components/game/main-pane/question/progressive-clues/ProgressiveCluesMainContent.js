import { Box } from '@mui/material';
import { clsx } from 'clsx';

import { GameStatus } from '@/backend/models/games/GameStatus';
import GameProgressiveCluesQuestionRepository from '@/backend/repositories/question/GameProgressiveCluesQuestionRepository';
import NextImage from '@/frontend/components/common/NextImage';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';

export default function ProgressiveCluesMainContent({ baseQuestion, showComplete }) {
  const game = useGame();

  return (
    <>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveProgressiveCluesMainContent baseQuestion={baseQuestion} showComplete={showComplete} />
      )}
      {game.status === GameStatus.QUESTION_END && <EndedProgressiveCluesMainContent baseQuestion={baseQuestion} />}
    </>
  );
}

function ProgressiveClues({ baseQuestion, showComplete }) {
  const game = useGame();

  const gameQuestionRepo = new GameProgressiveCluesQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const currentIdx = gameQuestion.currentClueIdx;
  const clues = baseQuestion.clues;
  const myIndex = showComplete ? clues.length - 1 : currentIdx;

  return (
    <ul className="list-disc pl-10 overflow-auto space-y-1">
      {clues.map((clue, idx) => (
        <li
          key={idx}
          className={clsx(
            '2xl:text-3xl',
            idx === currentIdx && 'font-bold',
            idx === currentIdx && game.status === GameStatus.QUESTION_ACTIVE && 'temp-glow',
            idx === currentIdx && showComplete && 'text-orange-300',
            !(idx <= myIndex) && 'opacity-0'
          )}
        >
          {idx <= myIndex && clue}
        </li>
      ))}
    </ul>
  );
}

function ActiveProgressiveCluesMainContent({ baseQuestion, showComplete }) {
  return (
    <div className="flex flex-col h-full w-1/2 justify-center">
      <ProgressiveClues baseQuestion={baseQuestion} showComplete={showComplete} />
    </div>
  );
}

function EndedProgressiveCluesMainContent({ baseQuestion }) {
  const answer = baseQuestion.answer;
  const image = answer.image;
  const title = answer.title;

  if (!image) {
    return <ActiveProgressiveCluesMainContent baseQuestion={baseQuestion} showComplete={true} />;
  }

  return (
    <Box className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <Box className="flex flex-col h-3/4 w-1/2 items-end justify-end">
        <NextImage url={image} alt={title} />
      </Box>
      <Box className="flex flex-col h-full w-1/2 items-start justify-center">
        <ProgressiveClues baseQuestion={baseQuestion} showComplete={true} />
      </Box>
    </Box>
  );
}
