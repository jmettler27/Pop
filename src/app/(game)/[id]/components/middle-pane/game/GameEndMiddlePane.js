import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc } from 'firebase/firestore'
import { useCollectionOnce, useDocumentDataOnce, useDocumentOnce } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'
import GameScoreboard from '@/app/components/scores/GameScoreboard'
import GameScoresChart from '@/app/components/scores/GameScoresChart'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'

export default function GameEndMiddlePane({ lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    return (
        <div className='flex flex-col h-full w-full items-center justify-center'>
            <div className='flex h-[10%] w-full items-center justify-center mt-3'>
                <h1 className='2xl:text-5xl font-bold'>{IT_WAS[lang]} <span className='text-yellow-300 italic'>{game.title}</span></h1>
            </div>
            <div className='flex h-[90%] w-full items-center justify-center'>
                <GameEndBody />
            </div>
        </div>
    )
}

const IT_WAS = {
    'en': "It was",
    'fr-FR': "C'était",
}


function GameEndBody() {
    const game = useGameContext()

    const finalRoundRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound)
    const [finalRoundDoc, finalRoundLoading, finalRoundError] = useDocumentOnce(finalRoundRef)

    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, game.id, 'teams')
    const [teamsCollection, teamsLoading, teamsError] = useCollectionOnce(teamsCollectionRef)

    const finalRoundScoresRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'realtime', 'scores')
    const [finalRoundScores, finalRoundScoresLoading, finalRoundScoresError] = useDocumentDataOnce(finalRoundScoresRef)

    if (finalRoundError) {
        return <p><strong>Error: {JSON.stringify(finalRoundError)}</strong></p>
    }
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (finalRoundScoresError) {
        return <p><strong>Error: {JSON.stringify(finalRoundScoresError)}</strong></p>
    }
    if (finalRoundLoading || teamsLoading || finalRoundScoresLoading) {
        return <LoadingScreen />
    }
    if (!finalRoundDoc || !teamsCollection || !finalRoundScores) {
        return <></>
    }

    const teams = teamsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const finalRound = { ...finalRoundDoc.data(), id: finalRoundDoc.id }

    return (
        <div className='flex flex-row h-full w-full items-center justify-center' >
            <div className='flex flex-col h-11/12 w-1/2 items-center justify-center'>
                <GameScoreboard roundScores={finalRoundScores} teams={teams} />
            </div>
            <div className='flex flex-col h-full w-1/2 items-center justify-center mr-4'>
                <GameScoresChart currentRoundOrder={finalRound.order} teams={teams} />
            </div>
        </div >
    )

}
