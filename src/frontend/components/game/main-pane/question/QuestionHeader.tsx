import { useRound } from '@/frontend/hooks/firestore/round/useRoundHooks';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';

export default function CurrentRoundQuestionOrder() {
  const game = useGame();
  const gameRepositories = useGameRepositories();
  const {
    round,
    loading: roundLoading,
    error: roundError,
  } = useRound(gameRepositories?.roundRepo ?? null, (game?.currentRound as string | undefined) ?? '');

  if (!game || !gameRepositories) return <>❓</>;

  if (roundError) return <>❓</>;
  if (roundLoading || !round) return <>❓</>;
  return <>{(round.currentQuestionIdx ?? 0) + 1}</>;
}
