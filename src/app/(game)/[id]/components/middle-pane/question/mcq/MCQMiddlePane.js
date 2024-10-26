import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { topicToEmoji } from '@/lib/utils/topics'
import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'
import MCQMainContent from '@/app/(game)/[id]/components/middle-pane/question/mcq/MCQMainContent'

export default function MCQMiddlePane({ question }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='h-[20%] flex flex-col items-center justify-center'>
                <MCQHeader question={question} />
            </div>
            <div className='h-[60%] w-full flex items-center justify-center'>
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
        <div className='flex flex-col items-center justify-center space-y-2'>
            <div className='flex flex-row items-center justify-center space-x-1'>
                <QuestionTypeIcon questionType={question.type} fontSize={40} />
                <h1 className='2xl:text-5xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong></h1>
            </div>
            <div className='flex flex-row items-center justify-center space-x-1'>
                <h2 className='2xl:text-5xl italic'>{question.details.source}</h2>
            </div>
        </div>
    )
}

function MCQFooter({ question }) {
    const { explanation } = question.details
    return explanation && <span className='w-[80%] 2xl:text-2xl text-center'>👉 {explanation}</span>
}
