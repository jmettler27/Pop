import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import GoGameHomeButton from '@/app/(game)/[id]/components/bottom-pane/GoGameHomeButton'
import { startGame } from '@/app/(game)/lib/transitions'
import { useAsyncAction } from '@/lib/utils/async'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function GameStartBottomPane() {
    const { id: gameId } = useParams()
    const { data: session } = useSession()
    const myRole = useRoleContext()

    const [handleClick, isStartinGame] = useAsyncAction(async () => {
        await startGame(gameId, session.user.id)
    })

    return myRole === 'organizer' && (
        <div className='flex flex-col items-center justify-center w-full h-full'>
            <GoGameHomeButton onClick={handleClick} disabled={isStartinGame} />
        </div>
    )
}
