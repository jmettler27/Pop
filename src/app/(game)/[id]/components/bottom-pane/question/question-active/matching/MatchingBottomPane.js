import { useEffect } from 'react'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc, collection, query, where } from 'firebase/firestore'
import { useDocumentData, useCollection } from 'react-firebase-hooks/firestore'

import GameChooserOrder from '@/app/(game)/[id]/components/GameChooserOrder'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import { updateTeamStatus } from '@/app/(game)/lib/players'

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

            {/* Left part: controller */}
            <div className='basis-3/4'>
                <MatchingController gameStates={gameStates} />
            </div>

            {/* Right part: list of riddle players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <GameChooserOrder gameStates={gameStates} />
            </div>
        </div>
    )

}

function MatchingController({ gameStates }) {
    const myRole = useRoleContext()

    const chooserTeamId = gameStates.chooserOrder[gameStates.chooserIdx]

    switch (myRole) {
        case 'organizer':
            return <MatchingOrganizerController chooserTeamId={chooserTeamId} />
        default:
            return <MatchingSpectatorController chooserTeamId={chooserTeamId} />
    }

}


function MatchingOrganizerController({ chooserTeamId }) {
    const game = useGameContext()

    useEffect(() => {
        if (game.status === 'question_active') {
            updateTeamStatus(game.id, chooserTeamId, 'focus')
        }
    }, [game.status, chooserTeamId])

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <span className='text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
            <MatchingOrganizerQuestionController />
        </div>
    )
}

function MatchingOrganizerQuestionController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            {/* Next clue */}
            <ResetQuestionButton />
            <EndQuestionButton />
        </div>
    )
}


function MatchingSpectatorController({ chooserTeamId }) {
    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <span className='text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
        </div>
    )
}