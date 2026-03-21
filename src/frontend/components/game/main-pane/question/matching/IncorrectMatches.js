import GameMatchingQuestionRepositoru from '@/backend/repositories/question/GameMatchingQuestionRepository';
import { isObjectEmpty } from '@/backend/utils/objects';

import useGame from '@/frontend/hooks/useGame';
import { getNodeId, MatchingEdge } from '@/frontend/components/game/main-pane/question/matching/gridUtils.js';
import '@/frontend/components/game/main-pane/question/matching/styles.scss';

export default function IncorrectMatches({ nodePositions, colIndices }) {
  const game = useGame();

  const gameQuestionRepo = new GameMatchingQuestionRepositoru(game.id, game.currentRound);
  const { incorrectMatches, loading, error } = gameQuestionRepo.useIncorrectMatches(game.currentQuestion);

  if (error || loading) {
    return <></>;
  }
  if (!incorrectMatches || isObjectEmpty(incorrectMatches)) {
    return <></>;
  }
  // elem = {uid:..., teamId:..., timestamp:..., matching: [row of col 0, row of col 1, ...]}

  return incorrectMatches.map((elem, idx) => {
    const origRows = elem.match;
    return colIndices.map((col) => (
      <MatchingEdge
        key={`incorrect_${origRows[col]}_${col}`}
        className={
          idx >= incorrectMatches.length - 1 ? 'MatchingGrid-edge-new-incorrect' : 'MatchingGrid-edge-incorrect'
        }
        sourceId={getNodeId(origRows[col], col)}
        targetId={getNodeId(origRows[col + 1], col + 1)}
        nodePositions={nodePositions}
      />
    ));
  });
}
