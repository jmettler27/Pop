
import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';

import PlayerName, { WinnerName } from '@/app/(game)/[id]/components/PlayerName'
import { ANSWER_TEXT } from '@/lib/utils/question/question';

export default function RiddleAnswer({ question, lang = 'en' }) {

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <span className="2xl:text-4xl">{ANSWER_TEXT[lang]}: <RiddleAnswerText question={question} /></span>
            <RiddleWinnerInfo />
        </div>
    )
}

function RiddleAnswerText({ question }) {
    const answer = question.details.answer

    switch (question.type) {
        case 'progressive_clues':
        case 'emoji':
            return <span className='font-bold text-green-500'>{answer.title}</span>
        case 'image':
            return <span className='font-bold text-green-500'>{answer}</span>
        case 'blindtest':
            return <span className='font-bold text-green-500'><i>{answer.title}</i>{answer.author && ` - ${answer.author}`} ({answer.source})</span>
    }

}

function RiddleWinnerInfo({ lang = 'en' }) {
    const game = useGameContext()
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))

    return <>
        {realtimeError && <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>}
        {realtimeLoading && <p>Loading question realtime info...</p>}
        {!realtimeLoading && realtime && (realtime.winner && game.status === 'question_end') && (
            <span className='text-2xl'><strong><WinnerName playerId={realtime.winner.playerId} teamId={realtime.winner.teamId} /></strong> {RIDDLE_WINNER_INFO_TEXT[lang]} 🥳</span>
        )}
    </>
}

const RIDDLE_WINNER_INFO_TEXT = {
    'en': "found it first!",
    'fr-FR': "l'a trouvée en premier!"
}