import { GameStatus } from '@/backend/models/games/GameStatus';

import { useGameContext } from '@/frontend/contexts';
import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import NextImage from '@/frontend/components/game/NextImage';
import { Box } from '@mui/material';
import { clsx } from 'clsx';

export default function ProgressiveCluesMainContent({ baseQuestion, showComplete }) {
  const game = useGameContext();

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
  const game = useGameContext();

  const gameQuestionRepo = new GameQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <LoadingScreen />;
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
