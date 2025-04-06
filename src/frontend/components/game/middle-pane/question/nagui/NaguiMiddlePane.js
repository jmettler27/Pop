import { topicToEmoji } from '@/backend/models/Topic'
import { QuestionType } from '@/backend/models/questions/QuestionType'
import { GameStatus } from '@/backend/models/games/GameStatus'
import { UserRole } from '@/backend/models/users/User'

import { QuestionTypeIcon } from '@/backend/utils/question_types'


import { useGameContext, useRoleContext } from '@/frontend/contexts'
import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader'
import NaguiMainContent from '@/frontend/components/game/middle-pane/question/nagui/NaguiMainContent'


export default function NaguiMiddlePane({ baseQuestion }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='h-[10%] flex flex-col items-center justify-center'>
                <NaguiHeader baseQuestion={baseQuestion} />
            </div>
            <div className='h-[70%] w-full flex items-center justify-center'>
                <NaguiMainContent baseQuestion={baseQuestion} />
            </div>
            <div className='h-[20%] flex items-center justify-center'>
                {(game.status === GameStatus.QUESTION_END || myRole === UserRole.ORGANIZER) && <NaguiFooter baseQuestion={baseQuestion} />}
            </div>
        </div>
    )
}


function NaguiHeader({ baseQuestion }) {

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

function NaguiFooter({ baseQuestion }) {
    const explanation = baseQuestion.explanation
    return explanation && <span className='w-[80%] 2xl:text-xl text-center'>👉 {explanation}</span>
}
