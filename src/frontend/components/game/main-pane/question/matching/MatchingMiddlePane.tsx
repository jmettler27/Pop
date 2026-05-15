import { useMemo } from 'react';

import ActiveMatchingQuestionGrid from '@/frontend/components/game/main-pane/question/matching/ActiveMatchingQuestionGrid';
import EndedMatchingQuestionGrid from '@/frontend/components/game/main-pane/question/matching/EndedMatchingQuestionGrid';
import { generateShuffledNodePositions } from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { MatchingAnswer, MatchingQuestion } from '@/models/questions/matching';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';

export default function MatchingMiddlePane({ baseQuestion }: { baseQuestion: MatchingQuestion }) {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] flex flex-col items-center justify-center">
        <MatchingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        <MatchingQuestionGrid baseQuestion={baseQuestion} />
      </div>
    </div>
  );
}

function MatchingQuestionHeader({ baseQuestion }: { baseQuestion: MatchingQuestion }) {
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

function MatchingQuestionGrid({ baseQuestion }: { baseQuestion: MatchingQuestion }) {
  const game = useGame();
  if (!game) return null;

  const answer = baseQuestion.answer as unknown as MatchingAnswer;
  const numCols = baseQuestion.numCols;
  const numRows = baseQuestion.numRows;

  const nodePositions = useMemo(() => generateShuffledNodePositions(numCols, numRows), [numCols, numRows]);

  return (
    <>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveMatchingQuestionGrid answer={answer} nodePositions={nodePositions} numCols={numCols} />
      )}
      {game.status === GameStatus.QUESTION_END && (
        <EndedMatchingQuestionGrid answer={answer} nodePositions={nodePositions} numCols={numCols} numRows={numRows} />
      )}
    </>
  );
}
