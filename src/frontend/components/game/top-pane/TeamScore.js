import { CircularProgress } from '@mui/material';

import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameStatus } from '@/models/games/GameStatus';
import { GameType } from '@/models/games/GameType';
import { RoundType } from '@/models/rounds/RoundType';
import { ScorePolicyType } from '@/models/ScorePolicy';

export default function TeamScore({ teamId }) {
  const game = useGame();

  if (game.type === GameType.RANDOM) {
    return <TeamGameScore teamId={teamId} />;
  } else if (game.type === GameType.ROUNDS) {
    if (game.roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
      return <CompletionRatePolicyTeamScore teamId={teamId} game={game} />;
    } else {
      return <RankingPolicyTeamScore teamId={teamId} game={game} />;
    }
  }
}

function TeamGameScore({ teamId }) {
  const { scoreRepo } = useGameRepositories();
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

  return (
    <span className="2xl:text-3xl">
      {gameScores.scores && Object.keys(gameScores.scores).includes(teamId) && gameScores.scores[teamId]}
    </span>
  );
}

function TeamRoundScore({ teamId, roundId }) {
  const game = useGame();
  const roundScoreRepo = new RoundScoreRepository(game.id, roundId);
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

  return (
    <span className="2xl:text-3xl">
      {roundScores.scores && Object.keys(roundScores.scores).includes(teamId) && roundScores.scores[teamId]}
    </span>
  );
}

function RankingPolicyTeamScore({ teamId, game }) {
  switch (game.status) {
    case GameStatus.GAME_EDIT:
    case GameStatus.GAME_START:
    case GameStatus.GAME_HOME:
    case GameStatus.GAME_END:
    case GameStatus.SPECIAL:
    case GameStatus.ROUND_START:
    case GameStatus.ROUND_END:
      return <TeamGameScore teamId={teamId} />;
    default:
      return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />;
  }
}

function CompletionRatePolicyTeamScore({ teamId, game }) {
  switch (game.status) {
    case GameStatus.GAME_EDIT:
    case GameStatus.GAME_START:
    case GameStatus.GAME_HOME:
    case GameStatus.GAME_END:
    case GameStatus.SPECIAL:
    case GameStatus.ROUND_START:
    case GameStatus.ROUND_END:
      return <TeamGameScore teamId={teamId} />;
    case GameStatus.QUESTION_ACTIVE:
    case GameStatus.QUESTION_END:
      return <CompletionRatePolicyTeamRoundActiveScore teamId={teamId} game={game} />;
    default:
      return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />;
  }
}

function CompletionRatePolicyTeamRoundActiveScore({ teamId, game }) {
  const { roundRepo } = useGameRepositories();
  const { round, loading, error } = roundRepo.useRound(game.currentRound);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!round) {
    return <></>;
  }

  console.log('Round.type', round.type);
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
      return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />;
    case RoundType.MATCHING:
    case RoundType.ODD_ONE_OUT:
      return <TeamGameScore teamId={teamId} />;
    default:
      return <TeamGameScore teamId={teamId} />;
  }
}
