import LoadingScreen from '@/frontend/components/LoadingScreen';

import { useGameContext } from '@/frontend/contexts';

import { getNodeId, MatchingEdge } from '@/frontend/components/game/middle-pane/question/matching/gridUtils.js';
import '@/frontend/components/game/middle-pane/question/matching/styles.scss';
import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';

export default function CorrectMatches({ nodePositions, colIndices }) {
  console.log('CORRECT MATCHES RENDERED');

  const game = useGameContext();

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id, game.currentRound);
  const { correctMatches, loading, error } = gameQuestionRepo.useCorrectMatches(game.currentQuestion);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <LoadingScreen loadingText="Loading correct matches..." />;
  }
  if (!correctMatches) {
    return <></>;
  }
  // elem = {uid:..., teamId:..., timestamp:..., matching: [row of col 0, row of col 1, ...]}

  return correctMatches.map((elem, idx) => {
    const origRow = elem.matchIdx;
    return colIndices.map((col) => (
      <MatchingEdge
        key={`correct_${origRow}_${col}`}
        className={idx >= correctMatches.length - 1 ? 'MatchingGrid-edge-new-correct' : 'MatchingGrid-edge-correct'}
        sourceId={getNodeId(origRow, col)}
        targetId={getNodeId(origRow, col + 1)}
        nodePositions={nodePositions}
      />
    ));
  });
}
