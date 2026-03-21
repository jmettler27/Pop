import { useIntl } from 'react-intl';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { topicToEmoji } from '@/backend/models/Topic';
import { ParticipantRole } from '@/backend/models/users/Participant';
import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import globalMessages from '@/i18n/globalMessages';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.BasicMiddlePane', {
  correct: 'Correct!',
});

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
  const game = useGame();
  const myRole = useRole();

  const gameQuestionRepo = new GameBasicQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
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
        {(game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
          <BasicQuestionFooter baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
        )}
      </div>
    </div>
  );
}

function BasicQuestionAnswer({ baseQuestion, gameQuestion }) {
  const game = useGame();
  const myRole = useRole();

  const statusToColor = (correct) => {
    if (correct === true)
      // Question has been answered correctly
      return 'text-green-600';
    else if (correct === false)
      // Question has been answered incorrectly
      return 'text-red-600'; // Question not answered yet
    else return myRole === ParticipantRole.ORGANIZER && 'text-orange-300';
  };

  return (
    (game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
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
    <span className="text-red-500">{intl.formatMessage(globalMessages.wrongAnswer)}</span>
  );
}
