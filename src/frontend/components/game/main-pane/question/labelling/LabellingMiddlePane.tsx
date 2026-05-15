'use client';

import { Box } from '@mui/material';

import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';
import { revealLabel } from '@/backend/services/question/labelling/actions';
import { isObjectEmpty } from '@/backend/utils/objects';
import NextImage from '@/frontend/components/common/NextImage';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

export default function LabellingMiddlePane({ baseQuestion }: { baseQuestion: LabellingQuestion }) {
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

function LabellingQuestionHeader({ baseQuestion }: { baseQuestion: LabellingQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
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

function LabellingMainContent({ baseQuestion }: { baseQuestion: LabellingQuestion }) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameLabellingQuestionRepository(game.id as string, game.currentRound as string);
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

  const gameQuestionData = gameQuestion as unknown as GameLabellingQuestion;
  const { revealed } = gameQuestionData;
  const title = baseQuestion.title;
  const image = baseQuestion.image;
  const labels = baseQuestion.labels ?? [];

  return (
    <Box className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <Box className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt={title ?? ''} />
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

interface DisplayedLabelProps {
  revealed: Record<string, unknown>[];
  label: string;
  labelIdx: number;
}

const DisplayedLabel = ({ revealed, label, labelIdx }: DisplayedLabelProps) => {
  const game = useGame();
  const myRole = useRole();

  const [handleLabelClick] = useAsyncAction(async () => {
    if (!game) return;
    await revealLabel(game.id as string, game.currentRound as string, game.currentQuestion as string, labelIdx);
  });

  const isQuestionEnd = game?.status === GameStatus.QUESTION_END;
  const revealedObj = revealed[labelIdx] ?? {};
  const hasBeenRevealed = !isObjectEmpty(revealedObj);
  const hasBeenRevealedByPlayer = hasBeenRevealed && revealedObj.playerId;

  if (isQuestionEnd || hasBeenRevealedByPlayer) {
    return <span className="text-green-500">{label}</span>;
  }

  if (hasBeenRevealed) {
    return <span className="text-blue-500">{label}</span>;
  }

  if (myRole === ParticipantRole.ORGANIZER) {
    return (
      <span className="text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50" onClick={handleLabelClick}>
        {label}
      </span>
    );
  }

  return <span className="text-yellow-500">???</span>;
};
