import { getNodeId, MatchingEdge, type NodeData } from '@/components/game/main-pane/question/matching/gridUtils';
import { isObjectEmpty } from '@/helpers/objects';
import { useIncorrectMatches } from '@/hooks/firestore/question/useGameMatchingQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';

import '@/components/game/main-pane/question/matching/styles.scss';

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
