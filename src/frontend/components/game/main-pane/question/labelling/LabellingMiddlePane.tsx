'use client';

import { questionAction } from '@/frontend/api';
import NextImage from '@/frontend/components/common/NextImage';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { QuestionTypeIcon } from '@/frontend/helpers/question-types';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameStatus } from '@/models/games/game-status';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { QuestionType, questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';
import { isObjectEmpty } from '@/utils/objects';

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
        <QuestionTypeIcon questionType={baseQuestion.type} className="size-7 md:size-[50px]" />
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

function LabellingMainContent({ baseQuestion }: { baseQuestion: LabellingQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.LABELLING, questionId);

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
    <div className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <div className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt={title ?? ''} />
      </div>
      <div className="flex flex-col h-[90%] max-w-1/2 items-start justify-start">
        <ol className="list-decimal pl-20 overflow-y-auto space-y-1">
          {labels.map((label, idx) => (
            <li key={idx} className="2xl:text-3xl">
              <DisplayedLabel revealed={revealed} label={label} labelIdx={idx} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

interface DisplayedLabelProps {
  revealed: Record<string, unknown>[];
  label: string;
  labelIdx: number;
}

const DisplayedLabel = ({ revealed, label, labelIdx }: DisplayedLabelProps) => {
  const game = useGame();
  const role = useRole();

  const [handleLabelClick] = useAsyncAction(async () => {
    if (!game) return;
    await questionAction(game.id as string, game.currentRound as string, game.currentQuestion as string, {
      action: 'reveal_label',
      labelIdx,
    });
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

  if (role === ParticipantRole.ORGANIZER) {
    return (
      <span className="text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50" onClick={handleLabelClick}>
        {label}
      </span>
    );
  }

  return <span className="text-yellow-500">???</span>;
};
