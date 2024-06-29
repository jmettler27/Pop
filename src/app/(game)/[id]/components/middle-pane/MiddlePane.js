import { useGameContext } from '@/app/(game)/contexts'

import GameStartMiddlePane from './game/GameStartMiddlePane'
import GameHomeMiddlePane from './game/GameHomeMiddlePane'
import GameEndMiddlePane from './game/GameEndMiddlePane'
import RoundMiddlePane from './round/RoundMiddlePane'
import QuestionMiddlePane from './question/QuestionMiddlePane'
import FinaleMiddlePane from './finale/FinaleMiddlePane'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'

export default function MiddlePane({ lang = DEFAULT_LOCALE }) {
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

        case 'build':
            return <span>{GAME_BUILD_TEXT[lang]}</span>

        default:
            return <></>
    }
}

const GAME_BUILD_TEXT = {
    'en': "The game is currently under construction. Come back later!",
    'fr-FR': "Le jeu est actuellement en construction. Reviens plus tard !",
}