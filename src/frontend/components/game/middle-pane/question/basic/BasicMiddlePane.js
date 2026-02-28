import { QuestionTypeIcon } from '@/backend/utils/question_types';
import { topicToEmoji } from '@/backend/models/Topic';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { UserRole } from '@/backend/models/users/User';

import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.BasicMiddlePane', {
  correct: 'Correct!',
  incorrect: 'Wrong answer!',
});

import LoadingScreen from '@/frontend/components/LoadingScreen';
import { useGameContext, useRoleContext } from '@/frontend/contexts';
import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader';

export default function BasicMiddlePane({ baseQuestion }) {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex h-[10%] flex-col items-center justify-center">
        <BasicQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="flex h-[10%] w-full items-center justify-center space-y-2">
        <h2 className="2xl:text-4xl">{baseQuestion.title}</h2>
      </div>
      <div className="flex h-[80%] w-full items-center justify-center">
        <BasicQuestionMainContent baseQuestion={baseQuestion} />
      </div>
    </div>
  );
}

function BasicQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-row items-center justify-center space-x-1">
      <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
      <h1 className="2xl:text-4xl">
        {topicToEmoji(baseQuestion.topic)}{' '}
        <strong>
          {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
        </strong>{' '}
        - {baseQuestion.source}
      </h1>
    </div>
  );
}

function BasicQuestionMainContent({ baseQuestion }) {
  const game = useGameContext();
  const myRole = useRoleContext();

  const gameQuestionRepo = new GameBasicQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <LoadingScreen loadingText="Loading..." />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex h-[80%] w-full items-center justify-center">
        <BasicQuestionAnswer baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
      </div>
      <div className="flex h-[20%] w-full items-center justify-center">
        {(game.status === GameStatus.QUESTION_END || myRole === UserRole.ORGANIZER) && (
          <BasicQuestionFooter baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
        )}
      </div>
    </div>
  );
}

function BasicQuestionAnswer({ baseQuestion, gameQuestion }) {
  const game = useGameContext();
  const myRole = useRoleContext();

  const statusToColor = (correct) => {
    if (correct === true)
      // Question has been answered correctly
      return 'text-green-600';
    else if (correct === false)
      // Question has been answered incorrectly
      return 'text-red-600'; // Question not answered yet
    else return myRole === UserRole.ORGANIZER && 'text-orange-300';
  };

  return (
    (game.status === GameStatus.QUESTION_END || myRole === UserRole.ORGANIZER) && (
      <span className={`2xl:text-4xl font-bold ${statusToColor(gameQuestion.correct)}`}>{baseQuestion.answer}</span>
    )
  );
}

function BasicQuestionFooter({ baseQuestion, gameQuestion }) {
  const explanation = baseQuestion.explanation;

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="text-4xl">
        {gameQuestion.correct !== null && <BasicQuestionPlayerAnswerText gameQuestion={gameQuestion} />}
      </span>
      {explanation && <span className="text-xs sm:text-sm 2xl:text-base 2xl:text-xl">👉 {explanation}</span>}
    </div>
  );
}

function BasicQuestionPlayerAnswerText({ gameQuestion }) {
  const intl = useIntl();
  return gameQuestion.correct ? (
    <span className="text-green-500">{intl.formatMessage(messages.correct)}</span>
  ) : (
    <span className="text-red-500">{intl.formatMessage(messages.incorrect)}</span>
  );
}
