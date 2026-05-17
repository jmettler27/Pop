import clsx from 'clsx';
import { useIntl } from 'react-intl';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import { validateItem } from '@/backend/services/question/enumeration/actions';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { EnumerationQuestion, EnumerationQuestionStatus } from '@/models/questions/enumeration';
import { questionTypeToTitle } from '@/models/questions/question-type';
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
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={40} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-4xl">{baseQuestion.title}</h2>
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
    <span className="2xl:text-3xl text-yellow-300">
      {intl.formatMessage(messages.thereAre)} {qualifier} <strong>{baseQuestion.answer?.length}</strong>{' '}
      {intl.formatMessage(messages.answers)}
    </span>
  );
}

function EnumerationQuestionAnswer({ answer }: { answer: string[] }) {
  const game = useGame();
  if (!game) return null;

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { timerRepo } = gameRepositories;
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (timerError) {
    return <ErrorScreen inline />;
  }
  if (timerLoading) {
    return <LoadingScreen inline />;
  }
  if (!timer) {
    return <></>;
  }

  const myRole = useRole();

  const showComplete = game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER;

  const [handleClick, isSubmitting] = useAsyncAction(async (itemIdx: number) => {
    await validateItem(game.id as string, game.currentRound as string, game.currentQuestion as string, itemIdx);
  });

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id as string, game.currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion as string);

  if (timerError || gameQuestionError || playersError) {
    return <ErrorScreen inline />;
  }
  if (timerLoading || gameQuestionLoading || playersLoading) {
    return <LoadingScreen inline />;
  }
  if (!timer || !gameQuestion || !questionPlayers) {
    return <></>;
  }

  const timerStatus = (timer as { status?: string }).status;
  const gameQuestionStatus = (gameQuestion as unknown as { status?: string }).status;
  const challenger = (questionPlayers as { challenger?: { cited?: Record<string, unknown> } }).challenger;

  return (
    <ul className="list-disc pl-10 h-full w-full flex flex-col flex-wrap overflow-auto items-center justify-center">
      {answer.map((item, index) => {
        const isCited = challenger?.cited?.[index] !== undefined;

        const isSelectable =
          !isSubmitting &&
          myRole === ParticipantRole.ORGANIZER &&
          gameQuestionStatus === EnumerationQuestionStatus.CHALLENGE &&
          timerStatus === TimerStatus.START &&
          !isCited;

        return (
          <li
            key={index}
            className={clsx(
              '2xl:text-3xl max-w-md pointer-events-none',
              isCited && 'text-green-500',
              !(showComplete || isCited) && 'opacity-0',
              isSelectable && 'pointer-events-auto cursor-pointer hover:opacity-50'
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
