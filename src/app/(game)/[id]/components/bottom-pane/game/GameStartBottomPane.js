import { useParams } from 'next/navigation'

import { useRoleContext } from '@/app/(game)/contexts'

import { startGame } from '@/app/(game)/lib/transitions'
import GoGameHomeButton from '@/app/(game)/[id]/components/bottom-pane/GoGameHomeButton'

import { useAsyncAction } from '@/lib/utils/async'

import TimerPane from '../../timer/TimerPane'
import AuthorizePlayersSwitch from '../AuthorizePlayersSwitch'
import ReadyPlayerController from '@/app/(game)/[id]/components/bottom-pane/ReadyPlayerController';

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
            {myRole === 'organizer' && <GameStartOrganizerController />}
        </div>
    )
}


function GameStartOrganizerController() {
    const { id: gameId } = useParams()

    const [handleStartGame, isStarting] = useAsyncAction(async () => {
        await startGame(gameId)
    })

    return (
        <div className='flex flex-col items-center justify-center h-full w-full'>
            <GoGameHomeButton onClick={handleStartGame} disabled={isStarting} />
            <AuthorizePlayersSwitch />
        </div>
    )
}
