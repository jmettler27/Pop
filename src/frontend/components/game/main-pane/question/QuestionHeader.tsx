import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameRounds } from '@/models/games/game';

export default function CurrentRoundQuestionOrder() {
  const game = useGame();
  const gameRepositories = useGameRepositories();

  if (!game || !gameRepositories) return <>❓</>;

  const { roundRepo } = gameRepositories;
  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound as string);

  if (roundError) return <>❓</>;
  if (roundLoading || !round) return <>❓</>;
  return <>{(round.currentQuestionIdx ?? 0) + 1}</>;
}
