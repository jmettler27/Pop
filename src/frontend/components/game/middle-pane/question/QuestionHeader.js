import { useGameContext } from '@/frontend/contexts';
import RoundRepository from '@/backend/repositories/round/RoundRepository';

export function CurrentRoundQuestionOrder() {
  const game = useGameContext();

  const roundRepo = new RoundRepository(game.id);
  const { round, roundLoading, roundError } = roundRepo.useRoundOnce(game.currentRound);

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
