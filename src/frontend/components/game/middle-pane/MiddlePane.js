import { GameStatus } from '@/backend/models/games/GameStatus';

import { useGameContext } from '@/frontend/contexts';

import GameStartMiddlePane from '@/frontend/components/game/middle-pane/game/GameStartMiddlePane';
import GameHomeMiddlePane from '@/frontend/components/game/middle-pane/game/GameHomeMiddlePane';
import GameEndMiddlePane from '@/frontend/components/game/middle-pane/game/GameEndMiddlePane';
import RoundMiddlePane from '@/frontend/components/game/middle-pane/round/RoundMiddlePane';
import QuestionMiddlePane from '@/frontend/components/game/middle-pane/question/QuestionMiddlePane';
import SpecialMiddlePane from '@/frontend/components/game/middle-pane/special/SpecialMiddlePane';
import BuildMiddlePane from '@/frontend/components/game/middle-pane/build/BuildMiddlePane';

export default function MiddlePane({}) {
  const game = useGameContext();

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

    case GameStatus.SPECIAL:
      return <SpecialMiddlePane />;

    case GameStatus.GAME_END:
      return <GameEndMiddlePane />;

    case GameStatus.GAME_EDIT:
      return <BuildMiddlePane />;

    default:
      return <></>;
  }
}
