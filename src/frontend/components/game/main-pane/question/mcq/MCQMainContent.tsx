import { useMemo } from 'react';
import Image from 'next/image';

import { clsx } from 'clsx';
import { Check, TriangleAlert, X } from 'lucide-react';

import { questionAction } from '@/frontend/api';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { usePlayerOnce } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import useTeamId from '@/frontend/hooks/useTeamId';
import { GameStatus } from '@/models/games/game-status';
import { GameMCQQuestion, MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';
import { shuffleIndices } from '@/utils/arrays';

export default function MCQMainContent({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  const { title, note, source } = baseQuestion;
  const choices = baseQuestion.choices ?? [];

  const randomMapping = useMemo(() => shuffleIndices(choices.length), [choices.length]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="shrink-0 w-full flex flex-col items-center justify-center gap-1.5 py-1 px-4">
        <h2 className="2xl:text-4xl font-bold text-center">
          {source && <span className="text-slate-400 font-normal">{source} : </span>}
          {title}
        </h2>
        {note && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs 2xl:text-sm max-w-lg">
            <TriangleAlert className="size-[13px] shrink-0" />
            <span className="italic">{note}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        <MCQMainContentQuestion baseQuestion={baseQuestion} randomization={randomMapping} />
      </div>
    </div>
  );
}

function MCQAnswerImage({ correct }: { correct: boolean | null | undefined }) {
  if (correct === true) {
    return (
      <Image
        src="/images/mcq-correct.png"
        alt="Correct answer"
        width={280}
        height={400}
        style={{ width: '70%', height: 'auto' }}
      />
    );
  }
  if (correct === false) {
    return (
      <Image
        src="/images/mcq-wrong.png"
        alt="Wrong answer"
        width={420}
        height={420}
        style={{ width: '80%', height: 'auto' }}
      />
    );
  }
  return <></>;
}

function MCQMainContentQuestion({
  baseQuestion,
  randomization,
}: {
  baseQuestion: MCQQuestion;
  randomization: number[];
}) {
  const game = useGame();

  const { gameQuestion, loading, error } = useQuestion(
    game?.id ?? null,
    game?.currentRound ?? null,
    QuestionType.MCQ,
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

  const gameQ = gameQuestion as unknown as GameMCQQuestion;

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <MCQAnswerImage correct={gameQ.correct} />
      </div>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveMCQChoices baseQuestion={baseQuestion} gameQuestion={gameQ} randomization={randomization} />
      )}
      {game.status === GameStatus.QUESTION_END && (
        <EndedMCQChoices baseQuestion={baseQuestion} gameQuestion={gameQ} randomization={randomization} />
      )}
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <MCQAnswerImage correct={gameQ.correct} />
      </div>
    </div>
  );
}

const choiceIsDisabled = (role: ParticipantRole | null, isChooser: boolean) =>
  !(role === ParticipantRole.PLAYER && isChooser);

interface MCQChoicesProps {
  baseQuestion: MCQQuestion;
  gameQuestion: GameMCQQuestion;
  randomization: number[];
}

function ActiveMCQChoices({ baseQuestion, gameQuestion, randomization }: MCQChoicesProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const teamId = useTeamId();
  const role = useRole();

  const choices = baseQuestion.choices ?? [];
  const isChooser = teamId === gameQuestion.teamId;

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx: number) => {
    await questionAction(gameId, roundId, questionId, { action: 'select_choice', choiceIdx: idx });
  });

  return (
    <ul className="rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3">
      {randomization.map((origIdx, idx) => (
        <li key={idx} className={clsx(idx !== choices.length - 1 && 'border-b border-border')}>
          <button
            type="button"
            disabled={isSubmitting || choiceIsDisabled(role, isChooser)}
            className="w-full text-left px-4 py-2 border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400 disabled:opacity-100"
            onClick={() => handleSelectChoice(origIdx)}
          >
            <span className="2xl:text-2xl">
              {MCQQuestion.CHOICES[idx]}. {choices[origIdx]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function EndedMCQChoices({ baseQuestion, gameQuestion, randomization }: MCQChoicesProps) {
  const choices = baseQuestion.choices ?? [];
  const answerIdx = baseQuestion.answerIdx;
  const { choiceIdx, correct, playerId } = gameQuestion;

  const isCorrectAnswer = (idx: number) => idx === answerIdx;
  const isIncorrectChoice = (idx: number) => idx === choiceIdx && idx !== answerIdx;
  const isNeutralChoice = (idx: number) => idx !== choiceIdx && idx !== answerIdx;

  const getBorderColor = (idx: number) => {
    if (isCorrectAnswer(idx)) return 'border-green-500';
    if (isIncorrectChoice(idx)) return 'border-red-600';
    if (isNeutralChoice(idx)) return 'border-white/35';
  };

  const getTextColor = (idx: number) => {
    if (isCorrectAnswer(idx)) return 'text-green-500 font-bold';
    if (isIncorrectChoice(idx)) return 'text-red-600 font-bold';
    if (isNeutralChoice(idx)) return 'text-white opacity-35';
  };

  const getListItemIcon = (idx: number) => {
    if (idx === answerIdx && correct === true) {
      return (
        <span className="flex items-center justify-center min-w-14">
          <span className="relative inline-flex">
            <Check className="size-6 text-green-500" />
            <span className="absolute -bottom-1 -right-1">
              <PlayerAvatar playerId={playerId} />
            </span>
          </span>
        </span>
      );
    }

    if (idx === choiceIdx && correct === false) {
      return (
        <span className="flex items-center justify-center min-w-14">
          <span className="relative inline-flex">
            <X className="size-6 text-destructive" />
            <span className="absolute -bottom-1 -right-1">
              <PlayerAvatar playerId={playerId} />
            </span>
          </span>
        </span>
      );
    }
  };

  return (
    <ul className="rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3">
      {randomization.map((origIdx, idx) => (
        <li key={idx} className={clsx(idx !== choices.length - 1 && 'border-b border-border')}>
          <div
            className={clsx(
              'flex items-center justify-between px-4 py-2 border-4 border-solid rounded-lg',
              getBorderColor(origIdx)
            )}
          >
            <span className={clsx('2xl:text-2xl', getTextColor(origIdx))}>
              {MCQQuestion.CHOICES[idx]}. {choices[origIdx]}
            </span>
            {getListItemIcon(origIdx)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlayerAvatar({ playerId }: { playerId: string | null }) {
  const gameId = useGameId();
  const { player, loading, error } = usePlayerOnce(gameId, playerId as string);

  return (
    !error &&
    !loading &&
    player && (
      <Avatar className="size-[30px]">
        <AvatarImage
          alt={(player as unknown as { name: string }).name}
          src={(player as unknown as { image: string }).image}
        />
        <AvatarFallback className="text-xs">
          {(player as unknown as { name: string }).name?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  );
}
