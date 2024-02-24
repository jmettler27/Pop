import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import RiddleAnswerImage from './RiddleAnswerImage'

import { clsx } from 'clsx'
import LoadingScreen from '@/app/components/LoadingScreen'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

export default function ProgressiveCluesMainContent({ question, showComplete }) {
    const game = useGameContext()

    return game.status === 'question_end' ?
        <RiddleAnswerImage question={question} /> :
        <ProgressiveClues question={question} showComplete={showComplete} />
}


function ProgressiveClues({ question, showComplete }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const realtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeRef)

    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <LoadingScreen />
    }
    if (!realtime) {
        return <></>
    }

    const currentIdx = realtime.currentClueIdx
    const clues = question.details.clues // Instead: fetch only the clues that are needed for a non-organizer user
    let myIndex = showComplete ? clues.length - 1 : currentIdx

    // Idea: for the organizer: show a "cursor" that points to the current clue
    return (
        <div className='flex flex-col h-full w-1/2 justify-center'>
            <ul className='list-disc pl-10 overflow-auto space-y-1'>
                {clues.map((clue, idx) => (
                    <li key={idx} className={clsx(
                        'text-3xl',
                        (idx === currentIdx) && 'temp-glow font-bold',
                        (myRole === 'organizer' && idx === currentIdx) && 'text-orange-300',
                        !(idx <= myIndex) && 'opacity-0'
                    )}>
                        {(idx <= myIndex) && clue}
                    </li>
                ))}
            </ul>
        </div>
    )
}
