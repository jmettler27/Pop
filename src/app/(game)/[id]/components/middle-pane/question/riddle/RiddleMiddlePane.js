import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'
import RiddleMainContent from './RiddleMainContent'
import RiddleAnswer from './RiddleAnswer'

import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import clsx from 'clsx'
import { blindtestTypeToEmoji } from '@/lib/utils/question/blindtest'

export default function RiddleMiddlePane({ question }) {
    const myRole = useRoleContext()
    const game = useGameContext()

    const showAnswer = (game.status === 'question_end' || myRole === 'organizer')

    return (
        <div className={clsx(
            'flex flex-col h-full items-center',
            // question.type === 'progressive_clues' && 'bg-progressive-clues',
        )}>
            <div className='flex h-[10%]'>
                <RiddleQuestionHeader question={question} />
            </div>
            <div className='flex h-[80%] w-full items-center justify-center'>
                <RiddleMainContent question={question} showComplete={showAnswer} />
            </div>
            <div className='flex h-[10%]'>
                {showAnswer && <RiddleAnswer question={question} />}
            </div>
        </div>
    )
}


function RiddleQuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center '>
            <QuestionTypeIcon questionType={question.type} fontSize={50} />
            <h1 className='2xl:text-5xl'>{question.type === 'blindtest' && blindtestTypeToEmoji(question.details.subtype)}{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: {question.details.title}</h1>
        </div>
    )
}
