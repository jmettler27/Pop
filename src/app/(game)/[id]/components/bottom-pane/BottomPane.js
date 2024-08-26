import { useGameContext } from '@/app/(game)/contexts'

import GameHomeBottomPane from './game/GameHomeBottomPane'
import GameStartBottomPane from './game/GameStartBottomPane'
import RoundBottomPane from './round/RoundBottomPane'
import QuestionBottomPane from './question/QuestionBottomPane'
import SpecialBottomPane from './special/SpecialBottomPane'
import GameEndBottomPane from './game/GameEndBottomPane'

export default function BottomPane() {
    const game = useGameContext();

    switch (game.status) {
        case 'game_start':
            return <GameStartBottomPane />

        case 'game_home':
            return <GameHomeBottomPane />

        case 'round_start':
        case 'round_end':
            return <RoundBottomPane />

        case 'question_active':
        case 'question_end':
            return <QuestionBottomPane />

        case 'special':
            return <SpecialBottomPane />

        case 'game_end':
            return <GameEndBottomPane />

        default:
            return <h1>BOTTOM PANE</h1>

    }
}
