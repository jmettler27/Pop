import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore'

export function CurrentRoundQuestionOrder() {
    const game = useGameContext()
    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading || !round)
        return <>❓</>
    return <>{round.currentQuestionIdx + 1}</>
}