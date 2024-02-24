import { useGameContext } from '@/app/(game)/contexts'

import GameStartMiddlePane from './game/GameStartMiddlePane'
import GameHomeMiddlePane from './game/GameHomeMiddlePane'
import GameEndMiddlePane from './game/GameEndMiddlePane'
import RoundMiddlePane from './round/RoundMiddlePane'
import QuestionMiddlePane from './question/QuestionMiddlePane'
import FinaleMiddlePane from './finale/FinaleMiddlePane'

export default function MiddlePane({ }) {
    const game = useGameContext()

    switch (game.status) {
        case 'game_start':
            return <GameStartMiddlePane />

        case 'game_home':
            return <GameHomeMiddlePane />

        case 'round_start':
        case 'round_end':
            return <RoundMiddlePane />

        case 'question_active':
        case 'question_end':
            return <QuestionMiddlePane />

        case 'finale':
            return <FinaleMiddlePane />

        case 'game_end':
            return <GameEndMiddlePane />

        default:
            return <h1>MIDDLE PANE</h1>
    }
}