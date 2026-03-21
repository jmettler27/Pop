import { isObjectEmpty } from '@/backend/utils/objects';
import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';

import useGame from '@/frontend/hooks/useGame';
import { getNodeId, MatchingEdge } from '@/frontend/components/game/main-pane/question/matching/gridUtils.js';
import '@/frontend/components/game/main-pane/question/matching/styles.scss';

export default function PartiallyCorrectMatches({ nodePositions }) {
  const game = useGame();

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id, game.currentRound);
  const { partiallyCorrectMatches, loading, error } = gameQuestionRepo.usePartiallyCorrectMatches(game.currentQuestion);

  if (error || loading) {
    return <></>;
  }

  if (!partiallyCorrectMatches || isObjectEmpty(partiallyCorrectMatches)) {
    return <></>;
  }

  // elem = {uid: ..., teamId: ..., timestamp: ..., colIndices: [...], matchIdx: ...}

  return partiallyCorrectMatches.map((elem, idx) => {
    const origRow = elem.matchIdx;
    const colIndices = elem.colIndices;

    // Draw a edge between any two consecutive pairs in colIndices
    const colIndicesPairs = [];
    for (let i = 0; i < colIndices.length - 1; i++) {
      colIndicesPairs.push([colIndices[i], colIndices[i + 1]]);
    }

    return colIndicesPairs.map(([col1, col2]) => (
      <MatchingEdge
        key={`partially_correct_${origRow}_${col1}_${col2}`}
        // className='MatchingGrid-edge-partially-correct'
        className={
          idx >= partiallyCorrectMatches.length - 1 ? 'MatchingGrid-edge-new-correct' : 'MatchingGrid-edge-correct'
        }
        sourceId={getNodeId(origRow, col1)}
        targetId={getNodeId(origRow, col2)}
        nodePositions={nodePositions}
      />
    ));
  });
}
