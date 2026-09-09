'use client';

import MobileGameEndScreen from '@/components/game/mobile/MobileGameEndScreen';
import MobileGameHomeScreen from '@/components/game/mobile/MobileGameHomeScreen';
import MobileGameStartScreen from '@/components/game/mobile/MobileGameStartScreen';
import MobileQuestionActiveControl from '@/components/game/mobile/MobileQuestionActiveControl';
import MobileQuestionEndScreen from '@/components/game/mobile/MobileQuestionEndScreen';
import MobileRoundEndScreen from '@/components/game/mobile/MobileRoundEndScreen';
import MobileRoundStartScreen from '@/components/game/mobile/MobileRoundStartScreen';
import useGame from '@/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';

export default function MobileGameStateControl() {
  const game = useGame();
  if (!game) return null;

  switch (game.status) {
    case GameStatus.GAME_START:
      return <MobileGameStartScreen />;
    case GameStatus.GAME_HOME:
      return <MobileGameHomeScreen />;
    case GameStatus.ROUND_START:
      return <MobileRoundStartScreen />;
    case GameStatus.QUESTION_ACTIVE:
      return <MobileQuestionActiveControl />;
    case GameStatus.QUESTION_END:
      return <MobileQuestionEndScreen />;
    case GameStatus.ROUND_END:
      return <MobileRoundEndScreen />;
    case GameStatus.GAME_END:
      return <MobileGameEndScreen />;
    default:
      return null;
  }
}
