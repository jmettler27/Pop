import { useGameContext } from '@/app/(game)/contexts'

import LoadingScreen from '@/app/components/LoadingScreen'

import RoundStartBody from '@/app/(game)/[id]/components/middle-pane/round/round-start/RoundStartBody'
import RoundEndBody from '@/app/(game)/[id]/components/middle-pane/round/round-end/RoundEndBody'

import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { RoundTypeIcon, ROUND_HEADER_TEXT } from '@/lib/utils/round'
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'


export default function RoundMiddlePane() {
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

    const SelectedRoundBody = () => {
        switch (game.status) {
            case 'round_start':
                return <RoundStartBody round={round} />
            case 'round_end':
                return <RoundEndBody currentRound={round} />
        }
    }

    return (
        <div className='flex flex-col h-full w-full items-center justify-center'>
            <div className='flex h-[10%] w-full items-center justify-center mt-3'>
                <RoundHeader round={round} />
            </div>
            <div className='flex h-[90%] w-full items-center justify-center'>
                <SelectedRoundBody />
            </div>
        </div>
    )
}


function RoundHeader({ round, lang = DEFAULT_LOCALE }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <RoundTypeIcon roundType={round.type} fontSize={50} />
            <h1 className='2xl:text-5xl'><span className='font-bold'>{ROUND_HEADER_TEXT[lang]} {round.order + 1}</span> - <i>{round.title}</i> </h1>
        </div>
    )
}