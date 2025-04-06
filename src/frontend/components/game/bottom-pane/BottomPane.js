import { GameStatus } from '@/backend/models/games/GameStatus'

import { useGameContext } from '@/frontend/contexts'

import GameHomeBottomPane from '@/frontend/components/game/bottom-pane/game/GameHomeBottomPane'
import GameStartBottomPane from '@/frontend/components/game/bottom-pane/game/GameStartBottomPane'
import RoundBottomPane from '@/frontend/components/game/bottom-pane/round/RoundBottomPane'
import QuestionBottomPane from '@/frontend/components/game/bottom-pane/question/QuestionBottomPane'
import SpecialBottomPane from '@/frontend/components/game/bottom-pane/special/SpecialBottomPane'
import GameEndBottomPane from '@/frontend/components/game/bottom-pane/game/GameEndBottomPane'


export default function BottomPane() {
    const game = useGameContext();

    switch (game.status) {
        case GameStatus.GAME_START:
            return <GameStartBottomPane />

        case GameStatus.GAME_HOME:
            return <GameHomeBottomPane />

        case GameStatus.ROUND_START:
        case GameStatus.ROUND_END:
            return <RoundBottomPane />

        case GameStatus.QUESTION_ACTIVE:
        case GameStatus.QUESTION_END:
            return <QuestionBottomPane />

        case GameStatus.SPECIAL:
            return <SpecialBottomPane />

        case GameStatus.GAME_END:
            return <GameEndBottomPane />

        default:
            return <h1>BOTTOM PANE</h1>

    }
}
