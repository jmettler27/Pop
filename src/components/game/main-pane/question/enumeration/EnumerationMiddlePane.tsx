import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { QUESTION_ACTIONS, questionAction } from '@/api';
import ErrorScreen from '@/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/components/game/NoteButton';
import LoadingScreen from '@/components/LoadingScreen';
import { QuestionTypeIcon } from '@/helpers/question-types';
import { useQuestion, useQuestionPlayers } from '@/hooks/firestore/question/useGameQuestionHooks';
import { useTimer } from '@/hooks/firestore/timer/useTimerHooks';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGame from '@/hooks/useGame';
import useRole from '@/hooks/useRole';
import defineMessages from '@/i18n/defineMessages';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { EnumerationQuestion, EnumerationQuestionStatus } from '@/models/questions/enumeration';
import { QuestionType, questionTypeToTitle } from '@/models/questions/question-type';
import { TimerStatus } from '@/models/timer';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.EnumerationMiddlePane', {
  thereAre: 'There are',
  exactly: 'exactly',
  atLeast: 'at least',
  answers: 'answers',
});

export default function EnumerationMiddlePane({ baseQuestion }: { baseQuestion: EnumerationQuestion }) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-1/6 flex flex-col items-center justify-center">
        <EnumerationQuestionHeader baseQuestion={baseQuestion} />
        <EnumerationQuestionObjective baseQuestion={baseQuestion} />
      </div>
      <div className="h-5/6 w-full overflow-auto">
        <EnumerationQuestionAnswer answer={baseQuestion.answer ?? []} />
      </div>
    </div>
  );
}

function EnumerationQuestionHeader({ baseQuestion }: { baseQuestion: EnumerationQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} className="size-10" />
        <h1 className="text-xs md:text-xl 2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="text-xs md:text-lg 2xl:text-4xl">{baseQuestion.title}</h2>
        {baseQuestion.note && <NoteButton note={baseQuestion.note} />}
      </div>
    </div>
  );
}

function EnumerationQuestionObjective({ baseQuestion }: { baseQuestion: EnumerationQuestion }) {
  const intl = useIntl();
  const qualifier = baseQuestion.maxIsKnown
    ? intl.formatMessage(messages.exactly)
    : intl.formatMessage(messages.atLeast);
  return (
    <span className="text-xs md:text-lg 2xl:text-3xl text-yellow-300">
      {intl.formatMessage(messages.thereAre)} {qualifier} <strong>{baseQuestion.answer?.length}</strong>{' '}
      {intl.formatMessage(messages.answers)}
    </span>
  );
}

function EnumerationQuestionAnswer({ answer }: { answer: string[] }) {
  const game = useGame();
  const role = useRole();

  const [handleClick, isSubmitting] = useAsyncAction(async (itemIdx: number) => {
    if (!game) return;
    await questionAction(game.id as string, game.currentRound as string, game.currentQuestion as string, {
      action: QUESTION_ACTIONS.EnumerationValidateItem,
      itemIdx,
    });
  });

  if (!game) return null;

  return (
    <EnumerationQuestionAnswerContent
      answer={answer}
      game={game}
      role={role}
      handleClick={handleClick}
      isSubmitting={isSubmitting}
    />
  );
}

function EnumerationQuestionAnswerContent({
  answer,
  game,
  role,
  handleClick,
  isSubmitting,
}: {
  answer: string[];
  game: GameRounds;
  role: ParticipantRole | null;
  handleClick: (itemIdx: number) => Promise<void>;
  isSubmitting: boolean;
}) {
  const { timer, timerLoading, timerError } = useTimer(game.id ?? null);

  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = useQuestion(
    game.id ?? null,
    (game.currentRound as string | undefined) ?? null,
    QuestionType.ENUMERATION,
    game.currentQuestion as string
  );

  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = useQuestionPlayers(
    game.id ?? null,
    (game.currentRound as string | undefined) ?? null,
    game.currentQuestion as string
  );

  if (timerError || gameQuestionError || playersError) {
    return <ErrorScreen inline />;
  }
  if (timerLoading || gameQuestionLoading || playersLoading) {
    return <LoadingScreen inline />;
  }
  if (!timer || !gameQuestion || !questionPlayers) {
    return <></>;
  }

  const showComplete = game.status === GameStatus.QUESTION_END || role === ParticipantRole.ORGANIZER;

  const timerStatus = timer.status;
  const gameQuestionStatus = (gameQuestion as unknown as { status?: string }).status;
  const challenger = (questionPlayers as { challenger?: { cited?: Record<string, unknown> } }).challenger;

  return (
    <ul className="list-disc pl-10 h-full w-full flex flex-col flex-wrap overflow-auto items-center justify-center">
      {answer.map((item, index) => {
        const isCited = challenger?.cited?.[index] !== undefined;

        const isSelectable =
          !isSubmitting &&
          role === ParticipantRole.ORGANIZER &&
          gameQuestionStatus === EnumerationQuestionStatus.CHALLENGE &&
          timerStatus === TimerStatus.START &&
          !isCited;

        return (
          <li
            key={index}
            className={clsx(
              '2xl:text-3xl max-w-md',
              isCited && 'text-green-500',
              !(showComplete || isCited) && 'opacity-0',
              isSelectable ? 'pointer-events-auto cursor-pointer hover:opacity-50' : 'pointer-events-none'
            )}
            onClick={() => handleClick(index)}
          >
            {(showComplete || isCited) && item}
          </li>
        );
      })}
    </ul>
  );
}
