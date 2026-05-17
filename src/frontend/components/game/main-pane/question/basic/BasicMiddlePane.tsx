import { useIntl } from 'react-intl';

import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { BasicQuestion, GameBasicQuestion } from '@/models/questions/basic';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.BasicMiddlePane', {
  correct: 'Correct!',
});

interface BasicMiddlePaneProps {
  baseQuestion: BasicQuestion;
}

export default function BasicMiddlePane({ baseQuestion }: BasicMiddlePaneProps) {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex h-[10%] flex-col items-center justify-center">
        <BasicQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="flex h-[10%] w-full items-center justify-center space-y-2">
        <h2 className="2xl:text-4xl">{(baseQuestion as { title?: string }).title}</h2>
      </div>
      <div className="flex h-[80%] w-full items-center justify-center">
        <BasicQuestionMainContent baseQuestion={baseQuestion} />
      </div>
    </div>
  );
}

interface BasicQuestionHeaderProps {
  baseQuestion: BasicQuestion;
}

function BasicQuestionHeader({ baseQuestion }: BasicQuestionHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-center space-x-1">
      <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
      <h1 className="2xl:text-4xl">
        {baseQuestion.topic ? topicToEmoji(baseQuestion.topic) : ''}{' '}
        <strong>
          {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
        </strong>{' '}
        - {(baseQuestion as { source?: string }).source}
      </h1>
    </div>
  );
}

interface BasicQuestionMainContentProps {
  baseQuestion: BasicQuestion;
}

function BasicQuestionMainContent({ baseQuestion }: BasicQuestionMainContentProps) {
  const game = useGame();
  if (!game) return null;
  const myRole = useRole();

  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const gameQuestionRepo = new GameBasicQuestionRepository(game.id as string, currentRound as string);
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

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex h-[80%] w-full items-center justify-center">
        <BasicQuestionAnswer baseQuestion={baseQuestion} gameQuestion={gameQuestion as GameBasicQuestion} />
      </div>
      <div className="flex h-[20%] w-full items-center justify-center">
        {(game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
          <BasicQuestionFooter baseQuestion={baseQuestion} gameQuestion={gameQuestion as GameBasicQuestion} />
        )}
      </div>
    </div>
  );
}

interface BasicQuestionAnswerProps {
  baseQuestion: BasicQuestion;
  gameQuestion: GameBasicQuestion;
}

function BasicQuestionAnswer({ baseQuestion, gameQuestion }: BasicQuestionAnswerProps) {
  const game = useGame();
  if (!game) return null;
  const myRole = useRole();

  const statusToColor = (correct: boolean | null | undefined) => {
    if (correct === true) return 'text-green-600';
    else if (correct === false) return 'text-red-600';
    else return myRole === ParticipantRole.ORGANIZER && 'text-orange-300';
  };

  return (
    (game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
      <span
        className={`2xl:text-4xl font-bold ${statusToColor((gameQuestion as { correct?: boolean | null }).correct)}`}
      >
        {(baseQuestion as { answer?: string }).answer}
      </span>
    )
  );
}

interface BasicQuestionFooterProps {
  baseQuestion: BasicQuestion;
  gameQuestion: GameBasicQuestion;
}

function BasicQuestionFooter({ baseQuestion, gameQuestion }: BasicQuestionFooterProps) {
  const explanation = (baseQuestion as { explanation?: string }).explanation;

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="text-4xl">
        {(gameQuestion as { correct?: boolean | null }).correct !== null && (
          <BasicQuestionPlayerAnswerText gameQuestion={gameQuestion} />
        )}
      </span>
      {explanation && <span className="text-xs sm:text-sm 2xl:text-base 2xl:text-xl">👉 {explanation}</span>}
    </div>
  );
}

interface BasicQuestionPlayerAnswerTextProps {
  gameQuestion: GameBasicQuestion;
}

function BasicQuestionPlayerAnswerText({ gameQuestion }: BasicQuestionPlayerAnswerTextProps) {
  const intl = useIntl();
  return (gameQuestion as { correct?: boolean | null }).correct ? (
    <span className="text-green-500">{intl.formatMessage(messages.correct)}</span>
  ) : (
    <span className="text-red-500">{intl.formatMessage(globalMessages.wrongAnswer)}</span>
  );
}
