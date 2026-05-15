import GameRepository from '@/backend/repositories/game/GameRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';

export interface GameRepositories {
  gameRepo: GameRepository;
  playerRepo: PlayerRepository;
  teamRepo: TeamRepository;
  organizerRepo: OrganizerRepository;
  scoreRepo: GameScoreRepository;
  timerRepo: TimerRepository;
  chooserRepo: ChooserRepository;
  readyRepo: ReadyRepository;
  roundRepo: RoundRepository;
}

export default function createGameRepositories(gameId: string): GameRepositories {
  return {
    gameRepo: new GameRepository(),
    playerRepo: new PlayerRepository(gameId),
    teamRepo: new TeamRepository(gameId),
    organizerRepo: new OrganizerRepository(gameId),
    scoreRepo: new GameScoreRepository(gameId),
    timerRepo: new TimerRepository(gameId),
    chooserRepo: new ChooserRepository(gameId),
    readyRepo: new ReadyRepository(gameId),
    roundRepo: new RoundRepository(gameId),
  };
}
