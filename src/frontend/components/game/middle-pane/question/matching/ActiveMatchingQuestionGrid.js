import { range } from '@/backend/utils/arrays';

import ActiveMatches from '@/frontend/components/game/middle-pane/question/matching/ActiveMatches';
import CorrectMatches from '@/frontend/components/game/middle-pane/question/matching/CorrectMatches';
import IncorrectMatches from '@/frontend/components/game/middle-pane/question/matching/IncorrectMatches';
import PartiallyCorrectMatches from '@/frontend/components/game/middle-pane/question/matching/PartiallyCorrectMatches';

export default function ActiveMatchingQuestionGrid({ answer, nodePositions, numCols }) {
  console.log('ACTIVE MATCHING GRID RENDERED');

  const colIndices = range(numCols - 1); // [0] or [0, 1]

  console.log('ActiveMatchingQuestionGrid', answer, nodePositions, colIndices, numCols);
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {/* Draw nodes */}
      {/* Draw user provided edges */}
      <ActiveMatches answer={answer} nodePositions={nodePositions} numCols={numCols} />

      {/* Draw the matches that users correctly found */}
      <CorrectMatches nodePositions={nodePositions} colIndices={colIndices} />

      {/* Draw the matches that users incorrectly found */}
      <IncorrectMatches nodePositions={nodePositions} colIndices={colIndices} />

      {/* Draw the matches that users partially found */}
      <PartiallyCorrectMatches nodePositions={nodePositions} />
    </svg>
  );
}
