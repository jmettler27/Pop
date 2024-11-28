import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'
import { Box } from '@mui/material'
import { isObjectEmpty } from '@/lib/utils'
import { revealLabel } from '@/app/(game)/lib/question/label'
import { QuestionTypeIcon, questionTypeToTitle } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'
import { CurrentRoundQuestionOrder } from '../QuestionHeader'
import { useDocumentData } from 'react-firebase-hooks/firestore'
import { doc } from 'firebase/firestore'
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import LoadingScreen from '@/app/components/LoadingScreen'
import { useAsyncAction } from '@/lib/utils/async'
import NoteButton from '@/app/(game)/[id]/components/NoteButton'

export default function LabelMiddlePane({ question }) {
    return (
        <div className='flex flex-col h-full items-center'>
            <div className='flex h-1/5 items-center justify-center'>
                <LabelQuestionHeader question={question} />
            </div>
            <div className='flex h-4/5 w-full items-center justify-center'>
                <LabelMainContent question={question} />
            </div>
        </div>
    )
}


function LabelQuestionHeader({ question }) {
    return (
        <div className='flex flex-col items-center justify-center space-y-2'>
            <div className='flex flex-row items-center justify-center space-x-1'>
                <QuestionTypeIcon questionType={question.type} fontSize={50} />
                <h1 className='2xl:text-5xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong></h1>
            </div>
            <div className='flex flex-row items-center justify-center space-x-1'>
                <h2 className='2xl:text-4xl'>{question.details.title}</h2>
                {question.details.note && <NoteButton note={question.details.note} />}
            </div>
        </div>
    )
}


function LabelMainContent({ question }) {
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

    const { revealed } = realtime
    const { title, image, labels } = question.details

    return (
        <Box className='flex flex-row h-full w-[90%] items-center justify-center space-x-8'>
            <Box className='flex flex-col h-3/4 max-w-1/2 items-end justify-end'>
                <FirebaseImage url={image} alt={title} />
            </Box>
            <Box className='flex flex-col h-[90%] max-w-1/2 items-start justify-start'>
                <ol className='list-decimal pl-20 overflow-y-auto space-y-1'>
                    {labels.map((label, idx) => <li key={idx} className='2xl:text-3xl'><DisplayedLabel revealed={revealed} label={label} labelIdx={idx} /></li>)}
                </ol>
            </Box>
        </Box>
    );
}


const DisplayedLabel = ({ revealed, label, labelIdx }) => {
    const game = useGameContext()
    const myRole = useRoleContext()

    const [handleLabelClick, isSubmitting] = useAsyncAction(async () => {
        await revealLabel(game.id, game.currentRound, game.currentQuestion, labelIdx)
    })

    const isQuestionEnd = game.status === 'question_end'
    const revealedObj = revealed[labelIdx]
    const hasBeenRevealed = !isObjectEmpty(revealedObj)
    const hasBeenRevealedByPlayer = hasBeenRevealed && revealedObj.playerId

    if (isQuestionEnd || hasBeenRevealedByPlayer) {
        return <span className='text-green-500'>{label}</span>;
    }

    if (hasBeenRevealed) {
        return <span className='text-blue-500'>{label}</span>;
    }

    if (myRole === 'organizer') {
        return (
            <span
                className='text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50'
                onClick={handleLabelClick}
                disabled={isSubmitting}
            >
                {label}
            </span>
        );
    }

    return <span className='text-yellow-500'>???</span>;
}