import { useGameContext } from '@/app/(game)/contexts'

import '@/app/(game)/[id]/components/middle-pane/question/matching/styles.scss';
import LoadingScreen from '@/app/components/LoadingScreen'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { MatchingEdge, getNodeId } from '@/app/(game)/[id]/components/middle-pane/question/matching/gridUtils.js';

export default function PartiallyCorrectMatches({ nodePositions }) {
    console.log("PARTIALLY CORRECT MATCHES RENDERED")

    const game = useGameContext()

    const partiallyCorrectRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'partially_correct')
    const [partiallyCorrectData, partiallyCorrectLoading, partiallyCorrectError] = useDocumentData(partiallyCorrectRef)
    if (partiallyCorrectError) {
        return <p><strong>Error: {JSON.stringify(partiallyCorrectError)}</strong></p>
    }
    if (partiallyCorrectLoading) {
        return <LoadingScreen loadingText="Loading partially correct matches..." />
    }
    if (!partiallyCorrectData) {
        return <></>
    }
    // elem = {uid: ..., teamId: ..., timestamp: ..., colIndices: [...], matchIdx: ...}
    const partiallyCorrectMatches = partiallyCorrectData.partiallyCorrectMatches

    return partiallyCorrectMatches.map((elem, idx) => {
        const origRow = elem.matchIdx
        const colIndices = elem.colIndices

        // Draw a edge between any two consecutive pairs in colIndices
        const colIndicesPairs = []
        for (let i = 0; i < colIndices.length - 1; i++) {
            colIndicesPairs.push([colIndices[i], colIndices[i + 1]])
        }

        return (
            colIndicesPairs.map(([col1, col2]) => (
                <MatchingEdge
                    key={`partially_correct_${origRow}_${col1}_${col2}`}
                    // className='MatchingGrid-edge-partially-correct'
                    className={idx >= partiallyCorrectMatches.length - 1 ? 'MatchingGrid-edge-new-correct' : 'MatchingGrid-edge-correct'}
                    sourceId={getNodeId(origRow, col1)}
                    targetId={getNodeId(origRow, col2)}
                    nodePositions={nodePositions}
                />
            ))
        )
    })

}
