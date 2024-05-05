import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import MCQMainContent from './MCQMainContent'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'

export default function MCQMiddlePane({ question }) {

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='flex h-[10%] flex-col items-center justify-center'>
                <MCQHeader question={question} />
            </div>
            <div className='flex h-[90%] w-full items-center justify-center'>
                <MCQMainContent question={question} />
            </div>
        </div>
    )
}


function MCQHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <QuestionTypeIcon questionType={question.type} fontSize={50} />
            <h1 className='2xl:text-4xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: {question.details.source}</h1>
        </div>
    )
}
