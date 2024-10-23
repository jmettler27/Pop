import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { CircularProgress } from '@mui/material'

import GameChooserOrder from '@/app/(game)/[id]/components/GameChooserOrder'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';

import NaguiPlayerController from './NaguiPlayerController'
import NaguiPlayerOptionHelperText from './NaguiPlayerOptionHelperText'
import NaguiOrganizerController from './NaguiOrganizerController'

export default function NaguiBottomPane({ question }) {
    const { id: gameId } = useParams()

    const [gameStates, statesLoading, statesError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states'))
    if (statesError) {
        return <p><strong>Error: {JSON.stringify(statesError)}</strong></p>
    }
    if (statesLoading) {
        return <CircularProgress />
    }
    if (!gameStates) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>

            {/* Left part: controller */}
            <div className='basis-3/4'>
                <NaguiController gameStates={gameStates} question={question} />
            </div>

            {/* Right part: list of riddle players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <GameChooserOrder gameStates={gameStates} />
            </div>
        </div>
    )

}

function NaguiController({ gameStates, question }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const chooserTeamId = gameStates.chooserOrder[gameStates.chooserIdx]

    const [realtime, realtimeLoading, realtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <CircularProgress />
    }
    if (!realtime) {
        return <></>
    }

    switch (myRole) {
        case 'organizer':
            return <NaguiOrganizerController realtime={realtime} />
        case 'player':
            return <NaguiPlayerController chooserTeamId={chooserTeamId} realtime={realtime} />
        default:
            return <NaguiSpectatorController chooserTeamId={chooserTeamId} realtime={realtime} />
    }

}

function NaguiSpectatorController({ chooserTeamId, realtime }) {
    return (
        <div className='flex flex-col h-full items-center justify-center'>
            {realtime.option === null & <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>}
            {realtime.option !== null && <span className='2xl:text-4xl font-bold'><NaguiPlayerOptionHelperText realtime={realtime} /></span>}
        </div>
    )
}