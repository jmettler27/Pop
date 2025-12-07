import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { useGameContext } from '@/frontend/contexts'
import { useGameRepositoriesContext } from '@/frontend/contexts'

import LoadingScreen from '@/frontend/components/LoadingScreen'
import GameScoreboard from '@/frontend/components/scores/GameScoreboard'
import GameScoresChart from '@/frontend/components/scores/GameScoresChart'


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

    const { roundRepo, teamRepo, scoreRepo } = useGameRepositoriesContext()

    const { round: finalRound, loading: finalRoundLoading, error: finalRoundError } = roundRepo.useRoundOnce(game.currentRound)
    const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams()
    const { roundScores, loading: roundScoresLoading, error: roundScoresError } = scoreRepo.useRoundScoresOnce(game.currentRound)

    if (finalRoundError || teamsError || roundScoresError) {
        return <p><strong>Error: {JSON.stringify(finalRoundError || teamsError || roundScoresError)}</strong></p>
    }
    if (finalRoundLoading || teamsLoading || roundScoresLoading) {
        return <LoadingScreen />
    }
    if (!finalRound || !teams || !roundScores) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full w-full items-center justify-center' >
            <div className='flex flex-col h-11/12 w-1/2 items-center justify-center'>
                <GameScoreboard roundScores={roundScores} teams={teams} />
            </div>
            <div className='flex flex-col h-full w-1/2 items-center justify-center mr-4'>
                <GameScoresChart currentRoundOrder={finalRound.order} teams={teams} />
            </div>
        </div >
    )

}
