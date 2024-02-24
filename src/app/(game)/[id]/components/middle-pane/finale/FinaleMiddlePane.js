import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'

import FinaleHomeMiddlePane from './home/FinaleHomeMiddlePane'
import FinaleThemeMiddlePane from './theme/FinaleThemeMiddlePane'

export default function FinaleMiddlePane({ }) {
    const game = useGameContext()

    const [roundDoc, roundLoading, roundError] = useDocument(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))

    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <LoadingScreen loadingText="Loading round..." />
    }
    if (!roundDoc) {
        return <></>
    }
    const round = { id: roundDoc.id, ...roundDoc.data() }

    switch (round.status) {
        case 'finale_home':
            return <FinaleHomeMiddlePane round={round} />
        case 'theme_active':
        case 'theme_end':
            return <FinaleThemeMiddlePane round={round} />
    }
}