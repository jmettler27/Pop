import { useGameContext } from '@/app/(game)/contexts'

import { clsx } from 'clsx'
import LoadingScreen from '@/app/components/LoadingScreen'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'

import { Box } from '@mui/material'

export default function ProgressiveCluesMainContent({ question, showComplete }) {
    const game = useGameContext()

    return <>
        {game.status === 'question_active' && <ActiveProgressiveCluesMainContent question={question} showComplete={showComplete} />}
        {game.status === 'question_end' && <EndedProgressiveCluesMainContent question={question} />}
    </>
}

function ProgressiveClues({ question, showComplete }) {
    const game = useGameContext()

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(questionRealtimeRef)

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
    const { clues } = question.details
    const myIndex = showComplete ? clues.length - 1 : currentIdx

    return (
        <ul className='list-disc pl-10 overflow-auto space-y-1'>
            {clues.map((clue, idx) => (
                <li key={idx} className={clsx(
                    '2xl:text-3xl',
                    (idx === currentIdx) && 'font-bold',
                    (idx === currentIdx && game.status === "question_active") && 'temp-glow',
                    (idx === currentIdx && showComplete) && 'text-orange-300',
                    !(idx <= myIndex) && 'opacity-0'
                )}>
                    {(idx <= myIndex) && clue}
                </li>
            ))}
        </ul>
    )
}

function ActiveProgressiveCluesMainContent({ question, showComplete }) {
    return (
        <div className='flex flex-col h-full w-1/2 justify-center'>
            <ProgressiveClues question={question} showComplete={showComplete} />
        </div>
    )
}

function EndedProgressiveCluesMainContent({ question }) {
    return (
        <Box className='flex flex-row h-full w-[90%] items-center justify-center space-x-8'>
            <Box className='flex flex-col h-3/4 w-1/2 items-end justify-end'>
                <FirebaseImage url={question.details.answer.image} alt={question.details.answer.title} />
            </Box>
            <Box className='flex flex-col h-full w-1/2 items-start justify-center'>
                <ProgressiveClues question={question} showComplete={true} />
            </Box>
        </Box>
    )
}