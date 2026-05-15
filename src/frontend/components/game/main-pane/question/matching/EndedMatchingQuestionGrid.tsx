import { range } from '@/backend/utils/arrays';
import {
  getNodeId,
  getNodeText,
  MatchingEdge,
  MatchingNode,
  type NodeData,
} from '@/frontend/components/game/main-pane/question/matching/gridUtils';

import '@/frontend/components/game/main-pane/question/matching/styles.scss';

import { MatchingAnswer } from '@/models/questions/matching';

interface EndedMatchingQuestionGridProps {
  answer: MatchingAnswer;
  nodePositions: NodeData[][];
  numCols: number;
  numRows: number;
}

export default function EndedMatchingQuestionGrid({
  answer,
  nodePositions,
  numCols,
  numRows,
}: EndedMatchingQuestionGridProps) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {nodePositions.map((column) =>
        column.map(({ id, col, pos }) => (
          <MatchingNode
            key={id}
            col={col}
            pos={pos}
            text={getNodeText(id, answer)}
            onClick={() => {}}
            isMatched={false}
            isActive={false}
            isAnswer={true}
            numCols={numCols}
          />
        ))
      )}

      {range(numRows).map((row) =>
        range(numCols - 1).map((col) => (
          <MatchingEdge
            key={`answer_${row}_${col}`}
            className="MatchingGrid-edge-answer"
            sourceId={getNodeId(row, col)}
            targetId={getNodeId(row, col + 1)}
            nodePositions={nodePositions}
          />
        ))
      )}
    </svg>
  );
}
