import { useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import GameChooserOrder from '@/app/(game)/[id]/components/GameChooserOrder'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'

export default function MatchingBottomPane({ }) {
    const { id: gameId } = useParams()

    const [gameStates, statesLoading, statesError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states'))
    if (statesError) {
        return <p><strong>Error: {JSON.stringify(statesError)}</strong></p>
    }
    if (statesLoading) {
        return <></>
    }
    if (!gameStates) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>
            <div className='basis-3/4'>
                <MatchingController gameStates={gameStates} />
            </div>
            <div className='basis-1/4'>
                <GameChooserOrder gameStates={gameStates} />
            </div>
        </div>
    )

}

function MatchingController({ gameStates }) {
    const myRole = useRoleContext()

    const chooserTeamId = gameStates.chooserOrder[gameStates.chooserIdx]

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
            {myRole === 'organizer' && <MatchingOrganizerQuestionController />}
        </div>
    )
}

function MatchingOrganizerQuestionController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton />
            <EndQuestionButton />
        </div>
    )
}
