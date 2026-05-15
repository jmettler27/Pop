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

interface IncorrectMatchesProps {
  nodePositions: NodeData[][];
  colIndices: number[];
}

export default function IncorrectMatches({ nodePositions, colIndices }: IncorrectMatchesProps) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id as string, game.currentRound as string);
  const { incorrectMatches, loading, error } = gameQuestionRepo.useIncorrectMatches(game.currentQuestion as string);

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
