import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { CircularProgress } from '@mui/material'
import clsx from 'clsx'

import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import { handleEnumAnswerItemClick } from '@/app/(game)/lib/question/enum'
import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'
import { useAsyncAction } from '@/lib/utils/async'

export default function EnumMiddlePane({ question }) {

    return (
        <div className='flex flex-col h-full'>
            <div className='h-1/6 flex flex-col items-center justify-center'>
                <EnumQuestionHeader question={question} />
                {/* {question.indication && <QuestionIndication indication={question.indication} />} */}
                <EnumQuestionObjective question={question} />
            </div>
            <div className='h-5/6 w-full overflow-auto'>
                <EnumQuestionAnswer answer={question.details.answer} />
            </div>
        </div>
    )
}

function EnumQuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <QuestionTypeIcon questionType={question.type} fontSize={40} />
            <h1 className='2xl:text-4xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: {question.details.title}</h1>
        </div>
    )
}

function EnumQuestionIndication({ indication }) {
    return (
        <p className='2xl:text-2xl'>
            <span className='underline'>Note</span>: {indication}
        </p>
    )
}

function EnumQuestionObjective({ question, lang = 'fr-FR' }) {
    switch (lang) {
        case 'en':
            return <span className='2xl:text-3xl text-yellow-300'>There are {question.details.maxIsKnown ? "exactly" : "at least"} <strong>{question.details.answer.length}</strong> answers</span>
        case 'fr-FR':
            return <span className='2xl:text-3xl text-yellow-300'>Il y a {question.details.maxIsKnown ? "exactement" : "au moins"} <strong>{question.details.answer.length}</strong> réponses</span>
    }
}

function EnumQuestionAnswer({ answer }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const showComplete = (game.status === 'question_end' || myRole === 'organizer') // 'player' or 'viewer'

    const [handleClick, isSubmitting] = useAsyncAction(async (itemIdx) => {
        await handleEnumAnswerItemClick(game.id, game.currentRound, game.currentQuestion, itemIdx)
    })

    const timerRef = doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'timer')
    const [timer, timerLoading, timerError] = useDocumentData(timerRef)

    const realtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeRef)

    const playersRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'players')
    const [players, playersLoading, playersError] = useDocumentData(playersRef)

    if (timerError) {
        return <p><strong>Error: </strong>{JSON.stringify(timerError)}</p>
    }
    if (realtimeError) {
        return <p><strong>Error: </strong>{JSON.stringify(realtimeError)}</p>
    }
    if (playersError) {
        return <p><strong>Error: </strong>{JSON.stringify(playersError)}</p>
    }
    if (timerLoading || realtimeLoading || playersLoading) {
        return <CircularProgress />
    }
    if (!timer || !realtime || !players) {
        return <></>
    }

    return (
        <ul className='list-disc pl-10 h-full w-full flex flex-col flex-wrap overflow-auto items-center justify-center'>
            {answer.map((item, index) => {
                const isCited = players.challenger?.cited[index] !== undefined

                const isSelectable = !isSubmitting && (myRole === 'organizer' && realtime.status === 'challenge_active' && timer.status === 'start') && !isCited

                return (
                    <li key={index}
                        className={clsx(
                            'text-3xl max-w-md pointer-events-none',
                            isCited && 'text-green-500',
                            !(showComplete || isCited) && 'opacity-0',
                            isSelectable && 'pointer-events-auto cursor-pointer hover:opacity-50'
                        )}
                        onClick={() => handleClick(index)}
                    >
                        {(showComplete || isCited) && item}
                    </li>
                )
            })}
        </ul>
    )
}

