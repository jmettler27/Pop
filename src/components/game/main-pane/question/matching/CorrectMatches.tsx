import { getNodeId, MatchingEdge, type NodeData } from '@/components/game/main-pane/question/matching/gridUtils';
import { Spinner } from '@/components/ui/spinner';
import { isObjectEmpty } from '@/helpers/objects';
import { useCorrectMatches } from '@/hooks/firestore/question/useGameMatchingQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';

import '@/components/game/main-pane/question/matching/styles.scss';

interface CorrectMatchesProps {
  nodePositions: NodeData[][];
  colIndices: number[];
}

export default function CorrectMatches({ nodePositions, colIndices }: CorrectMatchesProps) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { correctMatches, loading, error } = useCorrectMatches(gameId, roundId, questionId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
  }
  if (!correctMatches || isObjectEmpty(correctMatches as Record<string, unknown>)) {
    return <></>;
  }

  const matches = correctMatches as { matchIdx: number }[];

  return matches.map((elem, idx) => {
    const origRow = elem.matchIdx;
    return colIndices.map((col) => (
      <MatchingEdge
        key={`correct_${origRow}_${col}`}
        className={idx >= matches.length - 1 ? 'MatchingGrid-edge-new-correct' : 'MatchingGrid-edge-correct'}
        sourceId={getNodeId(origRow, col)}
        targetId={getNodeId(origRow, col + 1)}
        nodePositions={nodePositions}
      />
    ));
  });
}
