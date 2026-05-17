import { Box } from '@mui/material';
import { clsx } from 'clsx';

import GameProgressiveCluesQuestionRepository from '@/backend/repositories/question/GameProgressiveCluesQuestionRepository';
import NextImage from '@/frontend/components/common/NextImage';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { ProgressiveCluesQuestion } from '@/models/questions/progressive-clues';

interface ProgressiveCluesMainContentProps {
  baseQuestion: ProgressiveCluesQuestion;
  showComplete: boolean;
}

export default function ProgressiveCluesMainContent({ baseQuestion, showComplete }: ProgressiveCluesMainContentProps) {
  const game = useGame();
  if (!game) return null;

  return (
    <>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveProgressiveCluesMainContent baseQuestion={baseQuestion} showComplete={showComplete} />
      )}
      {game.status === GameStatus.QUESTION_END && <EndedProgressiveCluesMainContent baseQuestion={baseQuestion} />}
    </>
  );
}

function ProgressiveClues({ baseQuestion, showComplete }: ProgressiveCluesMainContentProps) {
  const game = useGame();
  if (!game) return null;
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const gameQuestionRepo = new GameProgressiveCluesQuestionRepository(game.id as string, currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const gq = gameQuestion as { currentClueIdx?: number };
  const currentIdx = gq.currentClueIdx ?? 0;
  const bq = baseQuestion as { clues?: string[] };
  const clues = bq.clues ?? [];
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

function ActiveProgressiveCluesMainContent({ baseQuestion, showComplete }: ProgressiveCluesMainContentProps) {
  return (
    <div className="flex flex-col h-full w-1/2 justify-center">
      <ProgressiveClues baseQuestion={baseQuestion} showComplete={showComplete} />
    </div>
  );
}

interface EndedProgressiveCluesMainContentProps {
  baseQuestion: ProgressiveCluesQuestion;
}

function EndedProgressiveCluesMainContent({ baseQuestion }: EndedProgressiveCluesMainContentProps) {
  const bq = baseQuestion as { answer?: { image?: string; title?: string } };
  const answer = bq.answer;
  const image = answer?.image;
  const title = answer?.title;

  if (!image) {
    return <ActiveProgressiveCluesMainContent baseQuestion={baseQuestion} showComplete={true} />;
  }

  return (
    <Box className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <Box className="flex flex-col h-3/4 w-1/2 items-end justify-end">
        <NextImage url={image} alt={title ?? ''} />
      </Box>
      <Box className="flex flex-col h-full w-1/2 items-start justify-center">
        <ProgressiveClues baseQuestion={baseQuestion} showComplete={true} />
      </Box>
    </Box>
  );
}
