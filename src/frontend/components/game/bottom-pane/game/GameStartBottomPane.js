import { startGame } from '@/backend/services/game/actions'

import { UserRole } from '@/backend/models/users/User'


import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { useGameContext, useRoleContext } from '@/frontend/contexts'

import GoGameHomeButton from '@/frontend/components/game/bottom-pane/GoGameHomeButton'
import TimerPane from '@/frontend/components/game/timer/TimerPane'
import ReadyPlayerController from '@/frontend/components/game/bottom-pane/ReadyPlayerController';


export default function GameStartBottomPane() {

    return (
        <div className='flex flex-row h-full items-center justify-center divide-x divide-solid'>

            <div className='flex flex-col h-full w-1/5 items-center justify-center'>
                <TimerPane />
            </div>

            <div className='flex flex-col h-full w-4/5 items-center justify-center'>
                <GameStartController />
            </div>
        </div>
    )
}


function GameStartController({ }) {
    const myRole = useRoleContext()

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-5'>
            <ReadyPlayerController />
            {myRole === UserRole.ORGANIZER && <GameStartOrganizerController />}
        </div>
    )
}


function GameStartOrganizerController() {
    const game = useGameContext()

    const [handleStartGame, isStarting] = useAsyncAction(async () => {
        await startGame(game.id)
    })

    return <GoGameHomeButton onClick={handleStartGame} disabled={isStarting} />
}
