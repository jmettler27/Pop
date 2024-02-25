import { useEffect } from 'react'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useCollection } from 'react-firebase-hooks/firestore'

import GameChooserOrder from '@/app/(game)/[id]/components/GameChooserOrder'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import { updateTeamStatus } from '@/app/(game)/lib/players';


export default function OddOneOutBottomPane({ }) {
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

            {/* Left part: controller */}
            <div className='basis-3/4'>
                <OddOneOutController gameStates={gameStates} />
            </div>

            {/* Right part: list of riddle players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <GameChooserOrder gameStates={gameStates} />
            </div>
        </div>
    )

}

function OddOneOutController({ gameStates }) {
    const myRole = useRoleContext()

    const chooserTeamId = gameStates.chooserOrder[gameStates.chooserIdx]

    switch (myRole) {
        case 'organizer':
            return <OddOneOutOrganizerController chooserTeamId={chooserTeamId} />
        default:
            return <OddOneOutSpectatorController chooserTeamId={chooserTeamId} />
    }

}


function OddOneOutOrganizerController({ chooserTeamId }) {
    const game = useGameContext()

    useEffect(() => {
        if (game.status === 'question_active') {
            updateTeamStatus(game.id, chooserTeamId, 'focus')
        }
    }, [game.status, chooserTeamId])

    return (
        <div className='flex flex-row h-full items-center justify-center'>
            <ResetQuestionButton />
            <EndQuestionButton />
        </div>
    )
}

function OddOneOutSpectatorController({ chooserTeamId }) {
    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <span className='text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
        </div>
    )
}