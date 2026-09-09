import { getNodeId, MatchingEdge, type NodeData } from '@/components/game/main-pane/question/matching/gridUtils';
import { isObjectEmpty } from '@/helpers/objects';
import { usePartiallyCorrectMatches } from '@/hooks/firestore/question/useGameMatchingQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';

import '@/components/game/main-pane/question/matching/styles.scss';

interface PartiallyCorrectMatchesProps {
  nodePositions: NodeData[][];
}

export default function PartiallyCorrectMatches({ nodePositions }: PartiallyCorrectMatchesProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { partiallyCorrectMatches, loading, error } = usePartiallyCorrectMatches(gameId, roundId, questionId);

  if (error || loading) {
    return <></>;
  }
  if (!partiallyCorrectMatches || isObjectEmpty(partiallyCorrectMatches as Record<string, unknown>)) {
    return <></>;
  }

  const matches = partiallyCorrectMatches as { matchIdx: number; colIndices: number[] }[];

  return matches.map((elem, idx) => {
    const origRow = elem.matchIdx;
    const colIndicesPairs: [number, number][] = [];
    for (let i = 0; i < elem.colIndices.length - 1; i++) {
      colIndicesPairs.push([elem.colIndices[i]!, elem.colIndices[i + 1]!]);
    }

    return colIndicesPairs.map(([col1, col2]) => (
      <MatchingEdge
        key={`partially_correct_${origRow}_${col1}_${col2}`}
        className={idx >= matches.length - 1 ? 'MatchingGrid-edge-new-correct' : 'MatchingGrid-edge-correct'}
        sourceId={getNodeId(origRow, col1)}
        targetId={getNodeId(origRow, col2)}
        nodePositions={nodePositions}
      />
    ));
  });
}
