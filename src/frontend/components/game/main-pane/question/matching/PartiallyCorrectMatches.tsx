import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import { isObjectEmpty } from '@/backend/utils/objects';
import {
  getNodeId,
  MatchingEdge,
  type NodeData,
} from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import useGame from '@/frontend/hooks/useGame';
import { GameRounds } from '@/models/games/game';

import '@/frontend/components/game/main-pane/question/matching/styles.scss';

interface PartiallyCorrectMatchesProps {
  nodePositions: NodeData[][];
}

export default function PartiallyCorrectMatches({ nodePositions }: PartiallyCorrectMatchesProps) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id as string, game.currentRound as string);
  const { partiallyCorrectMatches, loading, error } = gameQuestionRepo.usePartiallyCorrectMatches(
    game.currentQuestion as string
  );

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
