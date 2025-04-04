import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { topicToEmoji } from '@/lib/utils/topics'
import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'
import NaguiMainContent from '@/app/(game)/[id]/components/middle-pane/question/nagui/NaguiMainContent'

export default function NaguiMiddlePane({ question }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='h-[10%] flex flex-col items-center justify-center'>
                <NaguiHeader question={question} />
            </div>
            <div className='h-[70%] w-full flex items-center justify-center'>
                <NaguiMainContent question={question} />
            </div>
            <div className='h-[20%] flex items-center justify-center'>
                {(game.status === 'question_end' || myRole === 'organizer') && <NaguiFooter question={question} />}
            </div>
        </div>
    )
}


function NaguiHeader({ question }) {
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

function NaguiFooter({ question }) {
    const { explanation } = question.details
    return explanation && <span className='w-[80%] 2xl:text-xl text-center'>👉 {explanation}</span>
}
