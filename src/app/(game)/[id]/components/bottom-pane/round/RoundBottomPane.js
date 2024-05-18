import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'

import RoundStartBottomPane from './round-start/RoundStartBottomPane'
import RoundEndBottomPane from './round-end/RoundEndBottomPane'

export default function RoundBottomPane() {
    const game = useGameContext()

    const roundDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound)
    const [round, roundLoading, roundError] = useDocumentData(roundDocRef)

    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <LoadingScreen loadingText="Loading round..." />
    }
    if (!round) {
        return <></>
    }

    switch (game.status) {
        case 'round_start':
            return <RoundStartBottomPane />
        case 'round_end':
            return <RoundEndBottomPane endedRound={round} />
    }

}
