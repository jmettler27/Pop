import { useGameContext } from '@/frontend/contexts';

export function CurrentRoundQuestionOrder() {
  const game = useGameContext();

  const roundRepo = new RoundRepository();
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
