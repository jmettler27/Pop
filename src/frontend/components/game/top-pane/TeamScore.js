import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';

import { RoundType } from '@/backend/models/rounds/RoundType';
import { GameType } from '@/backend/models/games/GameType';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';

import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import { CircularProgress } from '@mui/material';

export default function TeamScore({ teamId }) {
  const game = useGameContext();

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
  const { scoreRepo } = useGameRepositoriesContext();
  const { gameScores, loading, error } = scoreRepo.useScores();

  if (error) {
    return (
      <p>
        <strong>Error:</strong> {JSON.stringify(error)}
      </p>
    );
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
  const game = useGameContext();
  const roundScoreRepo = new RoundScoreRepository(game.id, roundId);
  const { roundScores, loading, error } = roundScoreRepo.useScores();

  if (error) {
    return (
      <p>
        <strong>Error:</strong> {JSON.stringify(error)}
      </p>
    );
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
  const { roundRepo } = useGameRepositoriesContext();
  const { round, loading, error } = roundRepo.useRound(game.currentRound);

  if (error) {
    return (
      <p>
        <strong>Error:</strong> {JSON.stringify(error)}
      </p>
    );
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!round) {
    return <></>;
  }

  console.log('Round.type', round.type);
  switch (round.type) {
    case RoundType.MIXED:
    case RoundType.PROGRESSIVE_CLUES:
    case RoundType.IMAGE:
    case RoundType.EMOJI:
    case RoundType.BLINDTEST:
    case RoundType.QUOTE:
    case RoundType.LABELLING:
    case RoundType.ENUMERATION:
    case RoundType.MCQ:
    case RoundType.NAGUI:
    case RoundType.BASIC:
      return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />;
    case RoundType.ODD_ONE_OUT:
    case RoundType.MATCHING:
      return <TeamGameScore teamId={teamId} />;
    default:
      return <TeamGameScore teamId={teamId} />;
  }
}
