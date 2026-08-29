'use client';

import { useMemo } from 'react';
import Image from 'next/image';

import { clsx } from 'clsx';
import { Check, TriangleAlert, X } from 'lucide-react';

import { selectChoice } from '@/backend/services/question/nagui/actions';
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
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import { GameStatus } from '@/models/games/game-status';
import {
  DuoNaguiOption,
  GameNaguiQuestion,
  HideNaguiOption,
  NaguiQuestion,
  SquareNaguiOption,
} from '@/models/questions/nagui';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';
import { shuffleIndices } from '@/utils/arrays';

export default function NaguiMainContent({ baseQuestion }: { baseQuestion: NaguiQuestion }) {
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
        <NaguiMainContentQuestion baseQuestion={baseQuestion} randomization={randomMapping} />
      </div>
    </div>
  );
}

function NaguiAnswerImage({ correct }: { correct: boolean | null | undefined }) {
  if (correct === true) {
    return (
      <Image
        src="/images/nagui-correct.png"
        alt="Correct answer"
        width={500}
        height={375}
        style={{ width: '100%', height: 'auto' }}
      />
    );
  }
  if (correct === false) {
    return (
      <Image
        src="/images/nagui-wrong.png"
        alt="Wrong answer"
        width={500}
        height={374}
        style={{ width: '80%', height: 'auto' }}
      />
    );
  }
  return <></>;
}

function NaguiMainContentQuestion({
  baseQuestion,
  randomization,
}: {
  baseQuestion: NaguiQuestion;
  randomization: number[];
}) {
  const game = useGame();

  const { gameQuestion, loading, error } = useQuestion(
    game?.id ?? null,
    game?.currentRound ?? null,
    QuestionType.NAGUI,
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

  const gameQuestionData = gameQuestion as unknown as GameNaguiQuestion;

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <NaguiAnswerImage correct={gameQuestionData.correct} />
      </div>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestionData} randomization={randomization} />
      )}
      {game.status === GameStatus.QUESTION_END && (
        <EndedNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestionData} randomization={randomization} />
      )}
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <NaguiAnswerImage correct={gameQuestionData.correct} />
      </div>
    </div>
  );
}

const choiceIsDisabled = (
  choiceIdx: number,
  myRole: string | null,
  isChooser: boolean,
  option: string | null,
  duoIndices: number[]
): boolean => {
  if (!(myRole === ParticipantRole.PLAYER && isChooser)) return true;
  if (option === DuoNaguiOption.TYPE) return !duoIndices.includes(choiceIdx);
  if (option === SquareNaguiOption.TYPE) return false;
  return true;
};

function ActiveNaguiChoices({
  baseQuestion,
  gameQuestion,
  randomization,
}: {
  baseQuestion: NaguiQuestion;
  gameQuestion: GameNaguiQuestion;
  randomization: number[];
}) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const myTeam = useTeam();
  const myRole = useRole();
  const user = useUser();

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!user) return;
    await selectChoice(gameId, roundId, questionId, user.id as string, myTeam as string, idx);
  });

  const choices = baseQuestion.choices ?? [];
  const duoIndices = baseQuestion.duoIndices ?? [];

  const isChooser = myTeam === gameQuestion.teamId;

  if (gameQuestion.option === null || gameQuestion.option === HideNaguiOption.TYPE) {
    return (
      <span className="2xl:text-6xl">
        {HideNaguiOption.TYPE_TO_EMOJI} {SquareNaguiOption.TYPE_TO_EMOJI} {DuoNaguiOption.TYPE_TO_EMOJI} ?
      </span>
    );
  }

  return (
    <ul className="rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3">
      {randomization.map(
        (origIdx, idx) =>
          (gameQuestion.option !== DuoNaguiOption.TYPE || duoIndices.includes(origIdx)) && (
            <li key={idx} className={clsx(idx !== choices.length - 1 && 'border-b border-border')}>
              <button
                type="button"
                disabled={isSubmitting || choiceIsDisabled(origIdx, myRole, isChooser, gameQuestion.option, duoIndices)}
                className="w-full text-left px-4 py-2 border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400 disabled:opacity-100"
                onClick={() => handleSelectChoice(origIdx)}
              >
                <span className="2xl:text-2xl">
                  {NaguiQuestion.CHOICES[idx]}. {choices[origIdx]}
                </span>
              </button>
            </li>
          )
      )}
    </ul>
  );
}

function EndedNaguiChoices({
  baseQuestion,
  gameQuestion,
  randomization,
}: {
  baseQuestion: NaguiQuestion;
  gameQuestion: GameNaguiQuestion;
  randomization: number[];
}) {
  const choices = baseQuestion.choices ?? [];
  const answerIdx = baseQuestion.answerIdx;

  const choiceIdx = gameQuestion.choiceIdx;
  const correct = gameQuestion.correct;
  const playerId = gameQuestion.playerId;
  const option = gameQuestion.option;

  const isCorrectAnswer = (idx: number) =>
    (option === HideNaguiOption.TYPE && correct && idx === answerIdx) || idx === answerIdx;
  const isIncorrectChoice = (idx: number) =>
    (option === DuoNaguiOption.TYPE || option === SquareNaguiOption.TYPE) && idx === choiceIdx && idx !== answerIdx;
  const isNeutralChoice = (idx: number) =>
    (option === HideNaguiOption.TYPE && correct && idx !== answerIdx) || (idx !== choiceIdx && idx !== answerIdx);

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
    if (correct && idx === answerIdx) {
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

    if (option !== HideNaguiOption.TYPE && correct === false && idx === choiceIdx) {
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
              {NaguiQuestion.CHOICES[idx]}. {choices[origIdx]}
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
  const { player, loading, error } = usePlayerOnce(gameId, playerId ?? '');

  if (error || loading || !player) return null;

  const playerData = player as unknown as { name: string; image: string };
  return (
    <Avatar className="size-[30px]">
      <AvatarImage alt={playerData.name} src={playerData.image} />
      <AvatarFallback className="text-xs">{playerData.name?.[0]?.toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
