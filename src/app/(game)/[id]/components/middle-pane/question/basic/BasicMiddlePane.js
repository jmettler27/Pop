import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'


import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'


export default function BasicMiddlePane({ question }) {

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='flex h-[10%] flex-col items-center justify-center'>
                <BasicQuestionHeader question={question} />
            </div>
            <div className='flex h-[10%] w-full items-center justify-center space-y-2'>
                <h2 className='2xl:text-4xl'>{question.details.title}</h2>
            </div>
            <div className='flex h-[80%] w-full items-center justify-center'>
                <BasicQuestionMainContent question={question} />
            </div>
        </div>
    )
}


function BasicQuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <QuestionTypeIcon questionType={question.type} fontSize={50} />
            <h1 className='2xl:text-4xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: {question.details.source}</h1>
        </div>
    )
}

function BasicQuestionMainContent({ question }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const [realtime, realtimeLoading, realtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <LoadingScreen loadingText='Loading...' />
    }
    if (!realtime) {
        return <></>
    }

    return (
        <div className='flex flex-col h-full w-full'>
            <div className='flex h-[80%] w-full items-center justify-center'>
                <BasicQuestionAnswer question={question} realtime={realtime} />
            </div>
            <div className='flex h-[20%] w-full items-center justify-center'>
                {(game.status === 'question_end' || myRole === 'organizer') && <BasicQuestionFooter question={question} realtime={realtime} />}
            </div>
        </div>
    )
}

function BasicQuestionAnswer({ question, realtime }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const statusToColor = (correct) => {
        if (correct === true) // Question has been answered correctly
            return 'text-green-600'
        else if (correct === false) // Question has been answered incorrectly
            return 'text-red-600'
        else // Question not answered yet
            return (myRole === 'organizer') && 'text-orange-300'
    }

    return (game.status === 'question_end' || myRole === 'organizer') && <span className={`2xl:text-4xl font-bold ${statusToColor(realtime.correct)}`}>{question.details.answer}</span>

}


import { CORRECT_ANSWER_TEXT, INCORRECT_ANSWER_TEXT } from "@/lib/utils/question/question"

function BasicQuestionFooter({ question, realtime, lang = 'fr-FR' }) {
    const { explanation } = question.details

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <span className="text-4xl">{realtime.correct !== null && <BasicQuestionPlayerAnswerText realtime={realtime} lang={lang} />}</span>
            {explanation && <span className='2xl:text-2xl'>{explanation}</span>}
        </div>
    )
}

function BasicQuestionPlayerAnswerText({ realtime, lang = 'fr-FR' }) {
    return (realtime.correct) ?
        <span className="text-green-500">{CORRECT_ANSWER_TEXT[lang]}</span> :
        <span className="text-red-500">{INCORRECT_ANSWER_TEXT[lang]}</span>

}
