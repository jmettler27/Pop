import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import RiddlePlayerController from './controller/RiddlePlayerController'
import RiddleOrganizerController from './controller/RiddleOrganizerController'
import RiddleViewerController from './controller/RiddleViewerController'
import RiddlePlayers from './players/RiddlePlayers'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

export default function RiddleBottomPane({ question }) {
    const game = useGameContext()

    const playersDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'players')
    const [players, playersLoading, playersError] = useDocumentData(playersDocRef)

    if (playersError) {
        return <p><strong>Error: </strong>{JSON.stringify(playersError)}</p>
    }
    if (playersLoading) {
        return <></>
    }
    if (!players) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>

            {/* Left part: controller */}
            <div className='basis-3/4'>
                <RiddleController question={question} players={players} />
            </div>

            {/* Right part: list of riddle players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <RiddlePlayers players={players} />
            </div>
        </div>
    )
}

function RiddleController({ question, players }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case 'player':
            return <RiddlePlayerController players={players} />
        case 'organizer':
            return <RiddleOrganizerController question={question} players={players} />
        default:
            return <RiddleViewerController players={players} />
    }
}