import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'
import RiddleMainContent from './RiddleMainContent'
import RiddleAnswer from './RiddleAnswer'

import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import clsx from 'clsx'

export default function RiddleMiddlePane({ question }) {
    const myRole = useRoleContext()
    const game = useGameContext()

    const showAnswer = (game.status === 'question_end' || myRole === 'organizer')

    return (
        <div className={clsx(
            'flex flex-col h-full items-center',
            // question.type === 'progressive_clues' && 'bg-progressive-clues',
        )}>
            <div className='flex h-[10%] items-center justify-center'>
                <RiddleQuestionHeader question={question} />
            </div>
            <div className='flex h-[80%] w-full items-center justify-center'>
                <RiddleMainContent question={question} showComplete={showAnswer} />
            </div>
            <div className='flex h-[10%] items-center justify-center'>
                {showAnswer && <RiddleAnswer question={question} />}
            </div>
        </div>
    )
}


function RiddleQuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center '>
            <QuestionTypeIcon questionType={question.type} fontSize={50} />
            <h1 className='text-5xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: {question.details.title}</h1>
        </div>
    )
}
