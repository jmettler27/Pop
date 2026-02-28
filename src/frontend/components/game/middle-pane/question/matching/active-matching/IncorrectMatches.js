import GameMatchingQuestionRepositoru from '@/backend/repositories/question/GameMatchingQuestionRepository';

import LoadingScreen from '@/frontend/components/LoadingScreen';

import { useGameContext } from '@/frontend/contexts';

import { MatchingEdge, getNodeId } from '@/frontend/components/game/middle-pane/question/matching/gridUtils.js';
import '@/frontend/components/game/middle-pane/question/matching/styles.scss';

export default function IncorrectMatches({ nodePositions, colIndices }) {
  console.log('INCORRECT MATCHES RENDERED');

  const game = useGameContext();

  const gameQuestionRepo = new GameMatchingQuestionRepositoru(game.id, game.currentRound);
  const { incorrectMatches, loading, error } = gameQuestionRepo.useIncorrectMatches(game.currentQuestion);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <LoadingScreen loadingText="Loading incorrect matches..." />;
  }
  if (!incorrectMatches) {
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
