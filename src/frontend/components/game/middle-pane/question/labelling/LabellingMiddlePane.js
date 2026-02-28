import { revealLabel } from '@/backend/services/question/labelling/actions';

import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';

import { topicToEmoji } from '@/backend/models/Topic';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { UserRole } from '@/backend/models/users/User';
import { GameStatus } from '@/backend/models/games/GameStatus';

import { QuestionTypeIcon } from '@/backend/utils/question_types';
import { isObjectEmpty } from '@/backend/utils/objects';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import NextImage from '@/frontend/components/game/NextImage';
import { useGameContext, useRoleContext } from '@/frontend/contexts';
import NoteButton from '@/frontend/components/game/NoteButton';
import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader';

import { Box } from '@mui/material';

export default function LabellingMiddlePane({ baseQuestion }) {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex h-1/5 items-center justify-center">
        <LabellingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="flex h-4/5 w-full items-center justify-center">
        <LabellingMainContent baseQuestion={baseQuestion} />
      </div>
    </div>
  );
}

function LabellingQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
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

function LabellingMainContent({ baseQuestion }) {
  const game = useGameContext();

  const gameQuestionRepo = new GameLabellingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);
  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <LoadingScreen />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const { revealed } = gameQuestion;
  const title = baseQuestion.title;
  const image = baseQuestion.image;
  const labels = baseQuestion.labels;

  return (
    <Box className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <Box className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt={title} />
      </Box>
      <Box className="flex flex-col h-[90%] max-w-1/2 items-start justify-start">
        <ol className="list-decimal pl-20 overflow-y-auto space-y-1">
          {labels.map((label, idx) => (
            <li key={idx} className="2xl:text-3xl">
              <DisplayedLabel revealed={revealed} label={label} labelIdx={idx} />
            </li>
          ))}
        </ol>
      </Box>
    </Box>
  );
}

const DisplayedLabel = ({ revealed, label, labelIdx }) => {
  const game = useGameContext();
  const myRole = useRoleContext();

  const [handleLabelClick, isSubmitting] = useAsyncAction(async () => {
    await revealLabel(game.id, game.currentRound, game.currentQuestion, labelIdx);
  });

  const isQuestionEnd = game.status === GameStatus.QUESTION_END;
  const revealedObj = revealed[labelIdx];
  const hasBeenRevealed = !isObjectEmpty(revealedObj);
  const hasBeenRevealedByPlayer = hasBeenRevealed && revealedObj.playerId;

  if (isQuestionEnd || hasBeenRevealedByPlayer) {
    return <span className="text-green-500">{label}</span>;
  }

  if (hasBeenRevealed) {
    return <span className="text-blue-500">{label}</span>;
  }

  if (myRole === UserRole.ORGANIZER) {
    return (
      <span
        className="text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50"
        onClick={handleLabelClick}
        disabled={isSubmitting}
      >
        {label}
      </span>
    );
  }

  return <span className="text-yellow-500">???</span>;
};
