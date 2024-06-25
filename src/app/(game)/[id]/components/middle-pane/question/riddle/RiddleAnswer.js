
import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';

import PlayerName, { WinnerName } from '@/app/(game)/[id]/components/PlayerName'
import { getRandomElement } from '@/lib/utils/arrays';
import { DEFAULT_LOCALE } from '@/lib/utils/locales';

export default function RiddleAnswer({ question }) {

    return (
        <div className='flex flex-col h-full items-center'>
            <RiddleAnswerText question={question} />
            <RiddleWinnerInfo />
        </div>
    )
}

function RiddleAnswerText({ question }) {
    const { answer } = question.details

    switch (question.type) {
        case 'progressive_clues':
            return <span className='2xl:text-4xl font-bold text-green-500'>{answer.title}</span>
        case 'image':
        case 'emoji':
        case 'blindtest':
            return <></>
    }

}

function RiddleWinnerInfo({ lang = DEFAULT_LOCALE }) {
    const game = useGameContext()
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))

    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <p>Loading question realtime info...</p>
    }
    if (!realtime) {
        return <></>
    }

    if (!(realtime.winner && game.status === 'question_end')) {
        return <></>
    }

    return <span className='2xl:text-3xl'>{RIDDLE_WINNER_TEXT[lang]} <strong><WinnerName playerId={realtime.winner.playerId} teamId={realtime.winner.teamId} /></strong>! 🥳</span>
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