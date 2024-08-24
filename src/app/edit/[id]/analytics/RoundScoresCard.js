import { useParams } from 'next/navigation'

import React, { memo } from 'react';

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'
import LoadingScreen from '@/app/components/LoadingScreen';
import RoundScoresChart from '@/app/components/scores/RoundScoresChart';

import { questionTypeToEmoji } from '@/lib/utils/question_types'
import { ROUND_HEADER_TEXT } from '@/lib/utils/round';
import { DEFAULT_LOCALE } from '@/lib/utils/locales';


export const RoundScoresCard = memo(function RoundScoresCard({ round, teams, lang = DEFAULT_LOCALE }) {
    console.log("RoundScoresCard", round.id)

    const { id: gameId } = useParams()

    const [roundScores, roundScoresLoading, roundScoresError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'realtime', 'scores'))

    if (roundScoresError) {
        return <p><strong>Error: {JSON.stringify(roundScoresError)}</strong></p>
    }
    if (roundScoresLoading) {
        return <LoadingScreen loadingText="Loading round scores..." />
    }
    if (!roundScores) {
        return <></>
    }

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='2xl:text-2xl'>{questionTypeToEmoji(round.type)} {ROUND_HEADER_TEXT[lang]} {round.order + 1}: <i>{round.title}</i></CardTitle>
            </CardHeader>
            <CardContent>
                <div className='grid gap-4 md:grid-cols-1'>
                    <RoundScoresChart round={round} roundScores={roundScores} teams={teams} />
                </div>
            </CardContent>
        </Card>
    )
})

