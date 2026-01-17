import { topicToEmoji } from '@/backend/models/Topic';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { GameStatus } from '@/backend/models/games/GameStatus';

import { QuestionTypeIcon } from '@/backend/utils/question_types';

import NoteButton from '@/frontend/components/game/NoteButton';
import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader';
import ActiveMatchingQuestionGrid from '@/frontend/components/game/middle-pane/question/matching/ActiveMatchingQuestionGrid';
import EndedMatchingQuestionGrid from '@/frontend/components/game/middle-pane/question/matching/EndedMatchingQuestionGrid';
import { generateShuffledNodePositions } from '@/frontend/components/game/middle-pane/question/matching/gridUtils.js';

import { useGameContext } from '@/frontend/contexts';
import { useMemo } from 'react';

export default function MatchingMiddlePane({ baseQuestion }) {
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

function MatchingQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic)}{' '}
          <strong>
            {QuestionType.typeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
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

function MatchingQuestionGrid({ baseQuestion }) {
  const game = useGameContext();

  const answer = baseQuestion.answer;
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
