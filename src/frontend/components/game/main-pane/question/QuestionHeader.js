import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import { useGameRepositories } from '@/backend/repositories/useGameRepositories';

export default function CurrentRoundQuestionOrder() {
  const game = useGameContext();

  const { roundRepo } = useGameRepositoriesContext();
  const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound);

  if (roundError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundError)}</strong>
      </p>
    );
  }
  if (roundLoading || !round) return <>❓</>;
  return <>{round.currentQuestionIdx + 1}</>;
}
