
import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';

import PlayerName, { WinnerName } from '@/app/(game)/[id]/components/PlayerName'
import { getRandomElement } from '@/lib/utils/arrays';

export default function RiddleAnswer({ question, lang = 'en' }) {

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <RiddleAnswerText question={question} />
            <RiddleWinnerInfo />
        </div>
    )
}

function RiddleAnswerText({ question }) {
    const answer = question.details.answer

    switch (question.type) {
        case 'progressive_clues':
        case 'emoji':
            return <span className='2xl:text-4xl font-bold text-green-500'>{answer.title}</span>
        case 'image':
            return <span className='2xl:text-4xl font-bold text-green-500'>{answer}</span>
        case 'blindtest':
            return <></>
    }

}

function RiddleWinnerInfo({ lang = 'en' }) {
    const game = useGameContext()
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))

    return <>
        {realtimeError && <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>}
        {realtimeLoading && <p>Loading question realtime info...</p>}
        {!realtimeLoading && realtime && (realtime.winner && game.status === 'question_end') && (
            <span className='2xl:text-3xl'>{RIDDLE_WINNER_TEXT[lang]} <strong><WinnerName playerId={realtime.winner.playerId} teamId={realtime.winner.teamId} /></strong>! 🥳</span>
        )}
    </>
}

const RIDDLE_WINNER_TEXT_EN = [
    "GG",
    "Congrats",
    "Hats off",
    "Well done",
]

const RIDDLE_WINNER_TEXT_FR = [
    "GG",
    "Bravo",
    "Félicitations",
    "Chapeau",
    "Bien joué",
    "Super",
    "Excellent",
    "Parfait",
];

const RIDDLE_WINNER_TEXT = {
    'en': getRandomElement(RIDDLE_WINNER_TEXT_EN),
    'fr-FR': getRandomElement(RIDDLE_WINNER_TEXT_FR)
}