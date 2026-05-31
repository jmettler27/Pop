import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
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
  const bq = baseQuestion as { title?: string; source?: string; note?: string };
  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 py-2 w-full px-4">
        <BasicQuestionHeader baseQuestion={baseQuestion} />
        <h2 className="2xl:text-4xl text-center">
          {bq.source && <span className="text-slate-400 font-normal">{bq.source} : </span>}
          {bq.title}
        </h2>
        {bq.note && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs 2xl:text-sm max-w-lg">
            <WarningAmberIcon sx={{ fontSize: 13, flexShrink: 0 }} />
            <span className="italic">{bq.note}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
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
        </strong>
      </h1>
    </div>
  );
}

interface BasicQuestionMainContentProps {
  baseQuestion: BasicQuestion;
}

function BasicQuestionMainContent({ baseQuestion }: BasicQuestionMainContentProps) {
  const game = useGame();
  const myRole = useRole();
  if (!game) return null;

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

  const explanation = (baseQuestion as { explanation?: string }).explanation;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        <BasicQuestionAnswer baseQuestion={baseQuestion} gameQuestion={gameQuestion as GameBasicQuestion} />
      </div>
      <div className="flex-shrink-0 w-full flex flex-col items-center justify-center gap-2 py-2 px-4">
        {(game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
          <BasicQuestionPlayerAnswerText gameQuestion={gameQuestion as GameBasicQuestion} />
        )}
        {game.status === GameStatus.QUESTION_END && explanation && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm 2xl:text-base w-full max-w-2xl">
            <InfoOutlinedIcon sx={{ fontSize: 16, color: 'rgb(147 197 253)', flexShrink: 0, mt: '2px' }} />
            <span className="leading-snug">{explanation}</span>
          </div>
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
  const myRole = useRole();
  if (!game) return null;

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
