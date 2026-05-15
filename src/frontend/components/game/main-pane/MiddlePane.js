import GameEndMiddlePane from '@/frontend/components/game/main-pane/game/GameEndMiddlePane';
import GameHomeMiddlePane from '@/frontend/components/game/main-pane/game/GameHomeMiddlePane';
import GameStartMiddlePane from '@/frontend/components/game/main-pane/game/GameStartMiddlePane';
import QuestionMiddlePane from '@/frontend/components/game/main-pane/question/QuestionMiddlePane';
import RoundMiddlePane from '@/frontend/components/game/main-pane/round/RoundMiddlePane';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/GameStatus';

export default function MiddlePane({}) {
  const game = useGame();

  switch (game.status) {
    case GameStatus.GAME_START:
      return <GameStartMiddlePane />;

    case GameStatus.GAME_HOME:
      return <GameHomeMiddlePane />;

    case GameStatus.ROUND_START:
    case GameStatus.ROUND_END:
      return <RoundMiddlePane />;

    case GameStatus.QUESTION_ACTIVE:
    case GameStatus.QUESTION_END:
      return <QuestionMiddlePane />;

    case GameStatus.GAME_END:
      return <GameEndMiddlePane />;

    default:
      return <></>;
  }
}
