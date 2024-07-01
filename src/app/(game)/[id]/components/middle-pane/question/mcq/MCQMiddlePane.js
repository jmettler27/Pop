import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import MCQMainContent from './MCQMainContent'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'

export default function MCQMiddlePane({ question }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='h-[10%] flex flex-col items-center justify-center'>
                <MCQHeader question={question} />
            </div>
            <div className='h-[70%] w-full flex items-center justify-center'>
                <MCQMainContent question={question} />
            </div>
            <div className='h-[20%] flex items-center justify-center'>
                {(game.status === 'question_end' || myRole === 'organizer') && <MCQFooter question={question} />}
            </div>
        </div>
    )
}


function MCQHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <QuestionTypeIcon questionType={question.type} fontSize={50} />
            <h1 className='2xl:text-4xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: <i>{question.details.source}</i></h1>
        </div>
    )
}

function MCQFooter({ question }) {
    const { explanation } = question.details
    return explanation && <span className='w-[80%] 2xl:text-xl text-center'>{explanation}</span>
}
