import { CircularProgress } from '@mui/material';

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

interface CorrectMatchesProps {
  nodePositions: NodeData[][];
  colIndices: number[];
}

export default function CorrectMatches({ nodePositions, colIndices }: CorrectMatchesProps) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id as string, game.currentRound as string);
  const { correctMatches, loading, error } = gameQuestionRepo.useCorrectMatches(game.currentQuestion as string);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
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
