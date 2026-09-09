import ActiveMatches from '@/components/game/main-pane/question/matching/ActiveMatches';
import CorrectMatches from '@/components/game/main-pane/question/matching/CorrectMatches';
import { type NodeData } from '@/components/game/main-pane/question/matching/gridUtils';
import IncorrectMatches from '@/components/game/main-pane/question/matching/IncorrectMatches';
import PartiallyCorrectMatches from '@/components/game/main-pane/question/matching/PartiallyCorrectMatches';
import { range } from '@/helpers/arrays';
import { MatchingAnswer } from '@/models/questions/matching';

interface ActiveMatchingQuestionGridProps {
  answer: MatchingAnswer;
  nodePositions: NodeData[][];
  numCols: number;
}

export default function ActiveMatchingQuestionGrid({
  answer,
  nodePositions,
  numCols,
}: ActiveMatchingQuestionGridProps) {
  const colIndices = range(numCols - 1);

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <ActiveMatches answer={answer} nodePositions={nodePositions} numCols={numCols} />
      <CorrectMatches nodePositions={nodePositions} colIndices={colIndices} />
      <IncorrectMatches nodePositions={nodePositions} colIndices={colIndices} />
      <PartiallyCorrectMatches nodePositions={nodePositions} />
    </svg>
  );
}
