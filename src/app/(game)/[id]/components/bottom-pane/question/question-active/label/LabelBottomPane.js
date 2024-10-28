import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import LabelOrganizerController from './controller/LabelOrganizerController'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import RiddleSpectatorController from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/RiddleSpectatorController'
import RiddlePlayerController from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/RiddlePlayerController'
import RiddlePlayers from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/players/RiddlePlayers'

export default function LabelBottomPane({ question }) {
    const game = useGameContext()

    const questionPlayersRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'players')
    const [players, playersLoading, playersError] = useDocumentData(questionPlayersRef)

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
                <LabelController question={question} players={players} />
            </div>

            {/* Right part: list of Quote players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <RiddlePlayers players={players} />
            </div>
        </div>
    )
}

function LabelController({ question, players }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case 'player':
            return <RiddlePlayerController players={players} />
        case 'organizer':
            return <LabelOrganizerController question={question} players={players} />
        default:
            return <RiddleSpectatorController players={players} />
    }
}
