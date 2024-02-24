import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc } from 'firebase/firestore'
import { useCollectionOnce, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import RoundScoreboard from '@/app/(game)/[id]/components/scores/RoundScoreboard'
import RoundScoresChart from '@/app/(game)/[id]/components/scores/RoundScoresChart'
import GameScoreboard from '@/app/(game)/[id]/components/scores/GameScoreboard'
import GameScoresChart from '@/app/(game)/[id]/components/scores/GameScoresChart'

import LoadingScreen from '@/app/components/LoadingScreen'

export default function RoundEndBody({ currentRound, lang = 'en' }) {
    const { id: gameId } = useParams()

    const teamsRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const [teamsCollection, teamsLoading, teamsError] = useCollectionOnce(teamsRef)

    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', currentRound.id, 'realtime', 'scores')
    const [roundScores, roundScoresLoading, roundScoresError] = useDocumentDataOnce(roundScoresRef)

    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (roundScoresError) {
        return <p><strong>Error: {JSON.stringify(roundScoresError)}</strong></p>
    }
    if (teamsLoading || roundScoresLoading) {
        return <LoadingScreen />
    }
    if (!teamsCollection || !roundScores) {
        return <></>
    }
    const teams = teamsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    return (
        <div className='flex flex-col h-full w-full items-center justify-around overflow-auto'>
            {/* Round statistics */}
            <div className='flex flex-col h-1/2 w-full items-center justify-center'>
                <div className='flex flex-col h-[10%] w-full items-center justify-center'>
                    <h1 className='text-2xl text-yellow-300'>{ROUND_STATS_HEADER_TEXT[lang]}</h1>
                </div>
                <div className='flex flex-row h-[90%] w-full items-center justify-center'>
                    <div className='flex flex-col h-full w-2/3 items-center justify-center'>
                        <RoundScoreboard roundScores={roundScores} teams={teams} />
                    </div>
                    <div className='flex flex-col h-full w-1/2 items-center justify-center'>
                        {(currentRound.type !== 'finale') && <RoundScoresChart round={currentRound} roundScores={roundScores} teams={teams} />}
                    </div>
                </div>
            </div>
            {/* Game statistics */}
            <div className='flex flex-col h-1/2 w-full items-center justify-center'>
                <h1 className='text-2xl text-yellow-300'>{GAME_STATS_HEADER_TEXT[lang]}</h1>
                <div className='flex flex-row h-[90%] w-full items-center justify-center'>
                    <div className='flex flex-col h-11/12 w-2/3 items-center justify-center'>
                        <GameScoreboard roundScores={roundScores} teams={teams} />
                    </div>
                    <div className='flex flex-col h-full w-1/2 items-center justify-center'>
                        {(currentRound.order > 0) && <GameScoresChart currentRoundOrder={currentRound.order} teams={teams} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

const ROUND_STATS_HEADER_TEXT = {
    'en': "Round statistics",
    'fr-FR': "Statistiques de la manche"
}

const GAME_STATS_HEADER_TEXT = {
    'en': "Game statistics",
    'fr-FR': "Statistiques de la partie"
}