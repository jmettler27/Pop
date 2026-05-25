import { CircularProgress } from '@mui/material';

import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { GameType } from '@/models/games/game-type';
import { RoundType } from '@/models/rounds/round-type';
import { ScorePolicyType } from '@/models/score-policy';

export default function TeamScore({ teamId }: { teamId: string }) {
  const game = useGame();
  if (!game) return null;

  if (game.type === GameType.RANDOM) {
    return <TeamGameScore teamId={teamId} />;
  } else if (game.type === GameType.ROUNDS) {
    if (game.roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      return <CompletionRatePolicyTeamScore teamId={teamId} game={game as GameRounds} />;
    } else {
      return <RankingPolicyTeamScore teamId={teamId} game={game as GameRounds} />;
    }
  }
  return null;
}

function TeamGameScore({ teamId }: { teamId: string }) {
  const gameRepositories = useGameRepositories()!;
  const { scoreRepo } = gameRepositories;
  const { gameScores, loading, error } = scoreRepo.useScores();

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!gameScores) {
    return <></>;
  }

  const scores = gameScores.scores as Record<string, unknown>;
  return (
    <span className="2xl:text-3xl">{scores && Object.keys(scores).includes(teamId) && String(scores[teamId])}</span>
  );
}

function TeamRoundScore({ teamId, roundId }: { teamId: string; roundId: string }) {
  const game = useGame();
  const roundScoreRepo = new RoundScoreRepository(game?.id ?? '', roundId);
  const { roundScores, loading, error } = roundScoreRepo.useScores();

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!roundScores) {
    return <></>;
  }

  const scores = roundScores.scores as Record<string, unknown>;
  return (
    <span className="2xl:text-3xl">{scores && Object.keys(scores).includes(teamId) && String(scores[teamId])}</span>
  );
}

function RankingPolicyTeamScore({ teamId, game }: { teamId: string; game: GameRounds }) {
  switch (game.status) {
    case GameStatus.GAME_EDIT:
    case GameStatus.GAME_START:
    case GameStatus.GAME_HOME:
    case GameStatus.GAME_END:
    case GameStatus.ROUND_START:
    case GameStatus.ROUND_END:
      return <TeamGameScore teamId={teamId} />;
    default:
      return <TeamRoundScore teamId={teamId} roundId={game.currentRound as string} />;
  }
}

function CompletionRatePolicyTeamScore({ teamId, game }: { teamId: string; game: GameRounds }) {
  switch (game.status) {
    case GameStatus.GAME_EDIT:
    case GameStatus.GAME_START:
    case GameStatus.GAME_HOME:
    case GameStatus.GAME_END:
    case GameStatus.ROUND_START:
    case GameStatus.ROUND_END:
      return <TeamGameScore teamId={teamId} />;
    case GameStatus.QUESTION_ACTIVE:
    case GameStatus.QUESTION_END:
      return <CompletionRatePolicyTeamRoundActiveScore teamId={teamId} game={game} />;
    default:
      return <TeamRoundScore teamId={teamId} roundId={game.currentRound as string} />;
  }
}

function CompletionRatePolicyTeamRoundActiveScore({ teamId, game }: { teamId: string; game: GameRounds }) {
  const gameRepositories = useGameRepositories()!;
  const { roundRepo } = gameRepositories;
  const currentRound = game.currentRound as string;
  const { round, loading, error } = roundRepo.useRound(currentRound);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!round) {
    return <></>;
  }

  switch (round.type) {
    case RoundType.BASIC:
    case RoundType.BLINDTEST:
    case RoundType.EMOJI:
    case RoundType.ENUMERATION:
    case RoundType.ESTIMATION:
    case RoundType.IMAGE:
    case RoundType.LABELLING:
    case RoundType.MCQ:
    case RoundType.MIXED:
    case RoundType.NAGUI:
    case RoundType.PROGRESSIVE_CLUES:
    case RoundType.QUOTE:
    case RoundType.REORDERING:
      return <TeamRoundScore teamId={teamId} roundId={currentRound} />;
    case RoundType.MATCHING:
    case RoundType.ODD_ONE_OUT:
      return <TeamGameScore teamId={teamId} />;
    default:
      return <TeamGameScore teamId={teamId} />;
  }
}
