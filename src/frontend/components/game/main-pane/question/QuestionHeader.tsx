import { useRound } from '@/frontend/hooks/firestore/round/useRoundHooks';
import useGame from '@/frontend/hooks/useGame';

export default function CurrentRoundQuestionOrder() {
  const game = useGame();
  const {
    round,
    loading: roundLoading,
    error: roundError,
  } = useRound(game?.id ?? null, (game?.currentRound as string | undefined) ?? '');

  if (!game) return <>❓</>;

  if (roundError) return <>❓</>;
  if (roundLoading || !round) return <>❓</>;
  return <>{(round.currentQuestionIdx ?? 0) + 1}</>;
}
