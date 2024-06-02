import { memo } from 'react'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'

import { CircularProgress } from '@mui/material'
import { RoundTypeIcon } from '@/lib/utils/question_types'

import FinaleRoundProgress from './FinaleRoundProgress'
import RoundQuestionsProgress from './RoundQuestionsProgress'
import { ROUND_HEADER_TEXT } from '@/lib/utils/round'

export default function RoundProgressTabPanel({ game }) {
    const [roundDoc, roundLoading, roundError] = useDocument(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <CircularProgress />
    }
    if (!roundDoc) {
        return <></>
    }
    const round = { id: roundDoc.id, ...roundDoc.data() }

    return (
        <div className='flex flex-col w-full items-center'>
            <RoundProgressHeader roundType={round.type} roundOrder={round.order} roundTitle={round.title} />
            {round.type == 'finale' ?
                <FinaleRoundProgress game={game} round={round} /> :
                <RoundQuestionsProgress game={game} round={round} />
            }
        </div>
    )
}

const RoundProgressHeader = memo(function RoundProgressHeader({ roundType, roundOrder, roundTitle, lang = 'fr-FR' }) {
    console.log("RENDERED RoundProgressHeader")
    return (
        <div className='flex flex-row items-center w-full justify-center space-x-1 mt-1'>
            <RoundTypeIcon roundType={roundType} fontSize={20} />
            <span className='2xl:text-xl'><strong>{ROUND_HEADER_TEXT[lang]} {roundOrder + 1}</strong>: <i>{roundTitle}</i></span>
        </div>
    )
});
