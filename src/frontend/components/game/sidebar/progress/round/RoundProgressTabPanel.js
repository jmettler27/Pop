import { RoundType } from '@/backend/models/rounds/RoundType'
import { RoundTypeIcon, ROUND_HEADER_TEXT } from '@/backend/utils/rounds'


import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { useGameRepositoriesContext } from '@/frontend/contexts'

import SpecialRoundProgress from '@/frontend/components/game/sidebar/progress/round/SpecialRoundProgress'
import RoundQuestionsProgress from '@/frontend/components/game/sidebar/progress/round/RoundQuestionsProgress'

import { memo } from 'react'

import { CircularProgress } from '@mui/material'


export default function RoundProgressTabPanel({ game }) {
    const { roundRepo } = useGameRepositoriesContext()
    const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound)

    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <CircularProgress />
    }
    if (!round) {
        return <></>
    }

    return (
        <div className='flex flex-col w-full items-center'>
            <RoundProgressHeader roundType={round.type} roundOrder={round.order} roundTitle={round.title} />
            {round.type == RoundType.SPECIAL ?
                <SpecialRoundProgress game={game} round={round} /> :
                <RoundQuestionsProgress game={game} round={round} />
            }
        </div>
    )
}

const RoundProgressHeader = memo(function RoundProgressHeader({ roundType, roundOrder, roundTitle, lang = DEFAULT_LOCALE }) {
    console.log("RENDERED RoundProgressHeader")
    return (
        <div className='flex flex-row items-center w-full justify-center space-x-1 mt-1'>
            <RoundTypeIcon roundType={roundType} fontSize={20} />
            <span className='2xl:text-xl'><strong>{ROUND_HEADER_TEXT[lang]} {roundOrder + 1}</strong> - <i>{roundTitle}</i></span>
        </div>
    )
});
