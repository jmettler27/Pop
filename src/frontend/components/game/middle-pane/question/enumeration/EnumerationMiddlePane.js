import { validateItem } from '@/backend/services/question/enumeration/actions';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/game/GameEnumerationQuestionRepository';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { UserRole } from '@/backend/models/users/User';
import { TimerStatus } from '@/backend/models/Timer';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';
import { topicToEmoji } from '@/backend/models/Topic';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext, useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts';
import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';

import { QuestionTypeIcon } from '@/backend/utils/question_types';

import { CircularProgress } from '@mui/material';

import clsx from 'clsx';

export default function EnumerationMiddlePane({ question }) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-1/6 flex flex-col items-center justify-center">
        <EnumerationQuestionHeader question={question} />
        {/* {question.indication && <QuestionIndication indication={question.indication} />} */}
        <EnumerationQuestionObjective question={question} />
      </div>
      <div className="h-5/6 w-full overflow-auto">
        <EnumerationQuestionAnswer answer={question.answer} />
      </div>
    </div>
  );
}

function EnumerationQuestionHeader({ question }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={question.type} fontSize={40} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(question.topic)}{' '}
          <strong>
            {QuestionType.typeToTitle(question.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-4xl">{question.title}</h2>
        {question.note && <NoteButton note={question.note} />}
      </div>
    </div>
  );
}

function EnumerationQuestionObjective({ question, lang = DEFAULT_LOCALE }) {
  switch (lang) {
    case 'en':
      return (
        <span className="2xl:text-3xl text-yellow-300">
          There are {question.maxIsKnown ? 'exactly' : 'at least'} <strong>{question.answer.length}</strong> answers
        </span>
      );
    case 'fr-FR':
      return (
        <span className="2xl:text-3xl text-yellow-300">
          Il y a {question.maxIsKnown ? 'exactement' : 'au moins'} <strong>{question.answer.length}</strong> réponses
        </span>
      );
  }
}

function EnumerationQuestionAnswer({ answer }) {
  const game = useGameContext();
  const myRole = useRoleContext();

  const showComplete = game.status === GameStatus.QUESTION_END || myRole === UserRole.ORGANIZER; // 'player' or 'viewer'

  const [handleClick, isSubmitting] = useAsyncAction(async (itemIdx) => {
    await validateItem(game.id, game.currentRound, game.currentQuestion, itemIdx);
  });

  const { timerRepo } = useGameRepositoriesContext();
  const { timer, timerLoading, timerError } = timerRepo.useTimer(game.id);

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useGameQuestion(
    game.currentQuestion
  );

  const { players, playersLoading, playersError } = gameQuestionRepo.usePlayers(game.currentQuestion);

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
  if (!timer || !gameQuestion || !players) {
    return <></>;
  }

  return (
    <ul className="list-disc pl-10 h-full w-full flex flex-col flex-wrap overflow-auto items-center justify-center">
      {answer.map((item, index) => {
        const isCited = players.challenger?.cited[index] !== undefined;

        const isSelectable =
          !isSubmitting &&
          myRole === UserRole.ORGANIZER &&
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
