import { useRound } from '@/hooks/firestore/round/useRoundHooks';
import { useScores as useGameScores } from '@/hooks/firestore/score/useGameScoreHooks';
import { useScores as useRoundScores } from '@/hooks/firestore/score/useRoundScoreHooks';
import { type GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { GameType } from '@/models/games/game-type';
import { RoundType } from '@/models/rounds/round-type';
import { ScorePolicyType } from '@/models/score-policy';

// Statuses where every team's score is the game-level total, regardless of policy.
const GAME_LEVEL_STATUSES: GameStatus[] = [
  GameStatus.GAME_EDIT,
  GameStatus.GAME_START,
  GameStatus.GAME_HOME,
  GameStatus.GAME_END,
  GameStatus.ROUND_START,
  GameStatus.ROUND_END,
];

// Round types whose completion-rate score is still tracked at the game level while a question is
// active (they don't accumulate per-question the way the others do).
const GAME_LEVEL_ROUND_TYPES: RoundType[] = [RoundType.MATCHING, RoundType.ODD_ONE_OUT];

type ScoresMap = Record<string, unknown> | undefined;

// Resolves, once for every team, which score map the top pane should currently display — game-level or
// the current round's — mirroring the policy each TeamScore instance used to re-derive independently.
// Called once from TopPaneContainer; the result is handed down as a prop so N teams share one fetch
// instead of each opening its own.
export function useCurrentTeamScores(game: GameRounds | null): { scores: ScoresMap; loading: boolean } {
  const isRounds = game?.type === GameType.ROUNDS;
  const currentRoundId = (isRounds ? (game.currentRound as string | undefined) : undefined) ?? null;

  const needsRoundType =
    isRounds &&
    game.roundScorePolicy === ScorePolicyType.COMPLETION_RATE &&
    (game.status === GameStatus.QUESTION_ACTIVE || game.status === GameStatus.QUESTION_END);

  // All three are called unconditionally (Rules of Hooks); each already no-ops on a null id.
  const gameScoresResult = useGameScores(game?.id ?? null);
  const roundScoresResult = useRoundScores(game?.id ?? null, currentRoundId);
  const roundResult = useRound(needsRoundType ? (game.id ?? null) : null, needsRoundType ? currentRoundId! : '');

  if (!game) return { scores: undefined, loading: false };

  if (game.type === GameType.RANDOM || !isRounds || GAME_LEVEL_STATUSES.includes(game.status)) {
    return { scores: gameScoresResult.gameScores?.scores as ScoresMap, loading: gameScoresResult.loading };
  }

  if (needsRoundType) {
    if (roundResult.loading) return { scores: undefined, loading: true };
    const roundType = roundResult.round?.type;
    const useGameLevel = !roundType || GAME_LEVEL_ROUND_TYPES.includes(roundType);
    if (useGameLevel) {
      return { scores: gameScoresResult.gameScores?.scores as ScoresMap, loading: gameScoresResult.loading };
    }
  }

  return { scores: roundScoresResult.roundScores?.scores as ScoresMap, loading: roundScoresResult.loading };
}
