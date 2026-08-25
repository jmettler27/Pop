import {
  getNodeId,
  MatchingEdge,
  type NodeData,
} from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import { useIncorrectMatches } from '@/frontend/hooks/firestore/question/useGameMatchingQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import { isObjectEmpty } from '@/utils/objects';

import '@/frontend/components/game/main-pane/question/matching/styles.scss';

interface IncorrectMatchesProps {
  nodePositions: NodeData[][];
  colIndices: number[];
}

export default function IncorrectMatches({ nodePositions, colIndices }: IncorrectMatchesProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { incorrectMatches, loading, error } = useIncorrectMatches(gameId, roundId, questionId);

  if (error || loading) {
    return <></>;
  }
  if (!incorrectMatches || isObjectEmpty(incorrectMatches as Record<string, unknown>)) {
    return <></>;
  }

  const matches = incorrectMatches as { match: number[] }[];

  return matches.map((elem, idx) => {
    const origRows = elem.match;
    return colIndices.map((col) => (
      <MatchingEdge
        key={`incorrect_${origRows[col]}_${col}`}
        className={idx >= matches.length - 1 ? 'MatchingGrid-edge-new-incorrect' : 'MatchingGrid-edge-incorrect'}
        sourceId={getNodeId(origRows[col]!, col)}
        targetId={getNodeId(origRows[col + 1]!, col + 1)}
        nodePositions={nodePositions}
      />
    ));
  });
}
