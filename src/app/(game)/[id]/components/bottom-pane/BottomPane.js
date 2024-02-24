import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import GameHomeBottomPane from './game/GameHomeBottomPane'
import GameStartBottomPane from './game/GameStartBottomPane'
import RoundBottomPane from './round/RoundBottomPane'
import QuestionBottomPane from './question/QuestionBottomPane'
import FinaleBottomPane from './finale/FinaleBottomPane'

import OrganizerSpeedDial from '@/app/(game)/[id]/components/speed-dial/OrganizerSpeedDial'

export default function BottomPane() {
    const myRole = useRoleContext();

    return (
        <>
            {myRole === 'organizer' && <OrganizerSpeedDial />}
            <SelectedBottomPane />
        </>
    )
}

function SelectedBottomPane() {
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

        case 'finale':
            return <FinaleBottomPane />

        case 'game_end':
            return <></>

        default:
            return <h1>BOTTOM PANE</h1>

    }
}
