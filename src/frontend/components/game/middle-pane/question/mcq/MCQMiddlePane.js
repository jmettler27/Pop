
import { topicToEmoji } from '@/backend/models/Topic'
import { QuestionType } from '@/backend/models/questions/QuestionType'
import { GameStatus } from '@/backend/models/games/GameStatus'
import { UserRole } from '@/backend/models/users/User'

import { useGameContext, useRoleContext } from '@/frontend/contexts'
import { QuestionTypeIcon } from '@/backend/utils/question_types'
import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader'
import MCQMainContent from '@/frontend/components/game/middle-pane/question/mcq/MCQMainContent'


export default function MCQMiddlePane({ baseQuestion }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='h-[20%] flex flex-col items-center justify-center'>
                <MCQHeader baseQuestion={baseQuestion} />
            </div>
            <div className='h-[60%] w-full flex items-center justify-center'>
                <MCQMainContent baseQuestion={baseQuestion} />
            </div>
            <div className='h-[20%] flex items-center justify-center'>
                {(game.status === GameStatus.QUESTION_END || myRole === UserRole.ORGANIZER) && <MCQFooter baseQuestion={baseQuestion} />}
            </div>
        </div>
    )
}


function MCQHeader({ baseQuestion }) {
    return (
        <div className='flex flex-col items-center justify-center space-y-2'>
            <div className='flex flex-row items-center justify-center space-x-1'>
                <QuestionTypeIcon questionType={baseQuestion.type} fontSize={40} />
                <h1 className='2xl:text-5xl'>{topicToEmoji(baseQuestion.topic)} <strong>{QuestionType.typeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder /></strong></h1>
            </div>
            <div className='flex flex-row items-center justify-center space-x-1'>
                <h2 className='2xl:text-5xl italic'>{baseQuestion.source}</h2>
            </div>
        </div>
    )
}

function MCQFooter({ baseQuestion }) {
    const explanation = baseQuestion.explanation
    return explanation && <span className='w-[80%] 2xl:text-2xl text-center'>👉 {explanation}</span>
}
