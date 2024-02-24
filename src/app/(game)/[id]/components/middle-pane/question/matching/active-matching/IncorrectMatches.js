import { useGameContext } from '@/app/(game)/contexts'

import '@/app/(game)/[id]/components/middle-pane/question/matching/styles.scss';
import LoadingScreen from '@/app/components/LoadingScreen'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { MatchingEdge, getNodeId } from '@/app/(game)/[id]/components/middle-pane/question/matching/gridUtils.js';

export default function IncorrectMatches({ nodePositions, colIndices }) {
    console.log("INCORRECT MATCHES RENDERED")

    const game = useGameContext()

    const incorrectDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'incorrect')
    const [incorrectData, incorrectLoading, incorrectError] = useDocumentData(incorrectDocRef)
    if (incorrectError) {
        return <p><strong>Error: {JSON.stringify(incorrectError)}</strong></p>
    }
    if (incorrectLoading) {
        return <LoadingScreen loadingText="Loading incorrect matches..." />
    }
    if (!incorrectData) {
        return <></>
    }
    // elem = {uid:..., teamId:..., timestamp:..., matching: [row of col 0, row of col 1, ...]}
    const incorrectMatches = incorrectData.incorrectMatches

    return incorrectMatches.map((elem, idx) => {
        const origRows = elem.match
        return (
            colIndices.map((col) => (
                <MatchingEdge
                    key={`incorrect_${origRows[col]}_${col}`}
                    className={idx >= incorrectMatches.length - 1 ? 'MatchingGrid-edge-new-incorrect' : 'MatchingGrid-edge-incorrect'}
                    sourceId={getNodeId(origRows[col], col)}
                    targetId={getNodeId(origRows[col + 1], col + 1)}
                    nodePositions={nodePositions}
                />
            ))
        )
    })
}