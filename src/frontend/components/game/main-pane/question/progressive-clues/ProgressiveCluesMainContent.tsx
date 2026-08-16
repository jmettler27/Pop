import { clsx } from 'clsx';

import NextImage from '@/frontend/components/common/NextImage';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useGame from '@/frontend/hooks/useGame';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { ProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { QuestionType } from '@/models/questions/question-type';

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
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const { gameQuestion, loading, error } = useQuestion(
    game?.id ?? null,
    currentRound ?? null,
    QuestionType.PROGRESSIVE_CLUES,
    game?.currentQuestion as string
  );

  if (!game) return null;

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
    <div className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <div className="flex flex-col h-3/4 w-1/2 items-end justify-end">
        <NextImage url={image} alt={title ?? ''} />
      </div>
      <div className="flex flex-col h-full w-1/2 items-start justify-center">
        <ProgressiveClues baseQuestion={baseQuestion} showComplete={true} />
      </div>
    </div>
  );
}
