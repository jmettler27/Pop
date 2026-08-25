import { useRound } from '@/frontend/hooks/firestore/round/useRoundHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';

export default function CurrentRoundQuestionOrder() {
  const { gameId, roundId } = useActiveQuestion()!;
  const { round, loading: roundLoading, error: roundError } = useRound(gameId, roundId);

  if (roundError) return <>❓</>;
  if (roundLoading || !round) return <>❓</>;
  return <>{(round.currentQuestionIdx ?? 0) + 1}</>;
}
