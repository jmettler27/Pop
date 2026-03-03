import { validateItem } from '@/backend/services/question/enumeration/actions';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { ParticipantRole } from '@/backend/models/users/Participant';
import { TimerStatus } from '@/backend/models/Timer';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';
import { topicToEmoji } from '@/backend/models/Topic';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext, useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts';
import CurrentRoundQuestionOrder from '@/frontend/components/game/middle-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';

import { QuestionTypeIcon } from '@/backend/utils/question_types';

import { CircularProgress } from '@mui/material';

import clsx from 'clsx';

const messages = defineMessages('frontend.game.EnumerationMiddlePane', {
  thereAre: 'There are',
  exactly: 'exactly',
  atLeast: 'at least',
  answers: 'answers',
});

export default function EnumerationMiddlePane({ baseQuestion }) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-1/6 flex flex-col items-center justify-center">
        <EnumerationQuestionHeader baseQuestion={baseQuestion} />
        {/* {question.indication && <QuestionIndication indication={question.indication} />} */}
        <EnumerationQuestionObjective baseQuestion={baseQuestion} />
      </div>
      <div className="h-5/6 w-full overflow-auto">
        <EnumerationQuestionAnswer answer={baseQuestion.answer} />
      </div>
    </div>
  );
}

function EnumerationQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={40} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic)}{' '}
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

function EnumerationQuestionObjective({ baseQuestion }) {
  const intl = useIntl();
  const qualifier = baseQuestion.maxIsKnown
    ? intl.formatMessage(messages.exactly)
    : intl.formatMessage(messages.atLeast);
  return (
    <span className="2xl:text-3xl text-yellow-300">
      {intl.formatMessage(messages.thereAre)} {qualifier} <strong>{baseQuestion.answer.length}</strong>{' '}
      {intl.formatMessage(messages.answers)}
    </span>
  );
}

function EnumerationQuestionAnswer({ answer }) {
  const game = useGameContext();
  const myRole = useRoleContext();

  const showComplete = game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER; // 'player' or 'viewer'

  const [handleClick, isSubmitting] = useAsyncAction(async (itemIdx) => {
    await validateItem(game.id, game.currentRound, game.currentQuestion, itemIdx);
  });

  const { timerRepo } = useGameRepositoriesContext();
  const { timer, timerLoading, timerError } = timerRepo.useTimer(game.id);

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id, game.currentRound);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion);

  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion);

  if (timerError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(timerError)}
      </p>
    );
  }
  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(gameQuestionError)}
      </p>
    );
  }
  if (playersError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(playersError)}
      </p>
    );
  }
  if (timerLoading || gameQuestionLoading || playersLoading) {
    return <CircularProgress />;
  }
  if (!timer || !gameQuestion || !questionPlayers) {
    return <></>;
  }

  return (
    <ul className="list-disc pl-10 h-full w-full flex flex-col flex-wrap overflow-auto items-center justify-center">
      {answer.map((item, index) => {
        const isCited = questionPlayers.challenger?.cited[index] !== undefined;

        const isSelectable =
          !isSubmitting &&
          myRole === ParticipantRole.ORGANIZER &&
          gameQuestion.status === EnumerationQuestionStatus.CHALLENGE &&
          timer.status === TimerStatus.START &&
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
