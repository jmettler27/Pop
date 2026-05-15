import GameEndBottomPane from '@/frontend/components/game/main-pane/game/GameEndBottomPane';
import GameHomeBottomPane from '@/frontend/components/game/main-pane/game/GameHomeBottomPane';
import GameStartBottomPane from '@/frontend/components/game/main-pane/game/GameStartBottomPane';
import QuestionBottomPane from '@/frontend/components/game/main-pane/question/QuestionBottomPane';
import RoundBottomPane from '@/frontend/components/game/main-pane/round/RoundBottomPane';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';

export default function BottomPane() {
  const game = useGame();
  if (!game) return null;

  switch (game.status) {
    case GameStatus.GAME_START:
      return <GameStartBottomPane />;

    case GameStatus.GAME_HOME:
      return <GameHomeBottomPane />;

    case GameStatus.ROUND_START:
    case GameStatus.ROUND_END:
      return <RoundBottomPane />;

    case GameStatus.QUESTION_ACTIVE:
    case GameStatus.QUESTION_END:
      return <QuestionBottomPane />;

    case GameStatus.GAME_END:
      return <GameEndBottomPane />;

    default:
      return <h1>BOTTOM PANE</h1>;
  }
}
