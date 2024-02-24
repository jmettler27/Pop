import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import EnumReflectionActiveController from './enum-controller/reflection-active/EnumReflectionActiveController'
import EnumChallengeActiveController from './enum-controller/challenge-active/EnumChallengeActiveController'

import { CircularProgress } from '@mui/material'

export default function EnumController({ question }) {
    const game = useGameContext()

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeDocRef)

    const timerDocRef = doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'timer')
    const [timer, timerLoading, timerError] = useDocumentData(timerDocRef)

    if (realtimeError) {
        return <p><strong>Error: </strong>{JSON.stringify(realtimeError)}</p>
    }
    if (timerError) {
        return <p><strong>Error: </strong>{JSON.stringify(timerError)}</p>
    }
    if (realtimeLoading || timerLoading) {
        return <CircularProgress />
    }
    if (!realtime || !timer) {
        return <></>
    }

    switch (realtime.status) {
        case 'reflection_active':
            return <EnumReflectionActiveController question={question} timer={timer} />
        case 'challenge_active':
            return <EnumChallengeActiveController question={question} timer={timer} />
    }

}
