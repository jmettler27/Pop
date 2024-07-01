import { useGameContext } from '@/app/(game)/contexts'

import '@/app/(game)/[id]/components/middle-pane/question/matching/styles.scss';
import LoadingScreen from '@/app/components/LoadingScreen'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { MatchingEdge, getNodeId } from '@/app/(game)/[id]/components/middle-pane/question/matching/gridUtils.js';

export default function CorrectMatches({ nodePositions, colIndices }) {
    console.log("CORRECT MATCHES RENDERED")

    const game = useGameContext()
    const correctRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'correct')
    const [correctData, correctLoading, correctError] = useDocumentData(correctRef)
    if (correctError) {
        return <p><strong>Error: {JSON.stringify(correctError)}</strong></p>
    }
    if (correctLoading) {
        return <LoadingScreen loadingText="Loading correct matches..." />
    }
    if (!correctData) {
        return <></>
    }
    // elem = {uid:..., teamId:..., timestamp:..., matching: [row of col 0, row of col 1, ...]}
    const correctMatches = correctData.correctMatches

    return correctMatches.map((elem, idx) => {
        const origRow = elem.matchIdx
        return (
            colIndices.map((col) => (
                <MatchingEdge
                    key={`correct_${origRow}_${col}`}
                    className={idx >= correctMatches.length - 1 ? 'MatchingGrid-edge-new-correct' : 'MatchingGrid-edge-correct'}
                    sourceId={getNodeId(origRow, col)}
                    targetId={getNodeId(origRow, col + 1)}
                    nodePositions={nodePositions}
                />
            ))
        )
    })
}