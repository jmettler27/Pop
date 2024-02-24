import { useGameContext } from '@/app/(game)/contexts'

import { QuestionTypeIcon } from '@/lib/utils/question_types'
import { CircularProgress } from '@mui/material'

import { questionTypeToTitle } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore'

export function QuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <QuestionTypeIcon questionType={question.type} fontSize='large' />
            <QuestionHeaderContent question={question} />
        </div>
    )
}

function QuestionHeaderContent({ question }) {
    return <h1 className='text-3xl'><strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /> ({topicToEmoji(question.topic)})</strong>: {question.details.title}</h1>
}

export function CurrentRoundQuestionOrder() {
    const game = useGameContext()
    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading || !round)
        return <>❓</>
    return <>{round.currentQuestionIdx + 1}</>
}