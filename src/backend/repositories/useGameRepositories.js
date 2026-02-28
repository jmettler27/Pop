import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import GameRepository from '@/backend/repositories/game/GameRepository';

import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';

import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';

import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';

export function useGameRepositories(gameId) {
  return useMemo(() => {
    const gameRepo = new GameRepository();
    const playerRepo = new PlayerRepository(gameId);
    const teamRepo = new TeamRepository(gameId);
    const organizerRepo = new OrganizerRepository(gameId);
    const scoreRepo = new GameScoreRepository(gameId);
    const timerRepo = new TimerRepository(gameId);
    const chooserRepo = new ChooserRepository(gameId);
    const readyRepo = new ReadyRepository(gameId);

    const roundRepo = new RoundRepository(gameId);

    return {
      gameRepo,
      playerRepo,
      teamRepo,
      organizerRepo,
      scoreRepo,
      timerRepo,
      chooserRepo,
      readyRepo,
      roundRepo,
    };
  }, [gameId]);
}

// This hook is used only for initial game data and role determination
export function useGameData(gameId) {
  const repositories = useGameRepositories(gameId);

  const { game, loading: gameLoading, error: gameError } = repositories.gameRepo.useGameOnce(gameId);
  const {
    organizers,
    loading: orgLoading,
    error: orgError,
  } = repositories.organizerRepo.useAllOrganizerIdentitiesOnce();
  const { players, loading: playerLoading, error: playerError } = repositories.playerRepo.useAllPlayerIdentitiesOnce();

  return {
    game,
    organizers,
    players,
    loading: gameLoading || orgLoading || playerLoading,
    error: gameError || orgError || playerError,
  };
}

