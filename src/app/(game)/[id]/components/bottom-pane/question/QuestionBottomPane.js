import { useGameContext } from '@/app/(game)/contexts'

import QuestionActiveBottomPane from '@/app/(game)/[id]/components/bottom-pane/question/question-active/QuestionActiveBottomPane'
import QuestionEndBottomPane from '@/app/(game)/[id]/components/bottom-pane/question/question-end/QuestionEndBottomPane'

import TimerPane from '@/app/(game)/[id]/components/timer/TimerPane'

export default function QuestionBottomPane() {
    return (
        <div className='flex flex-row h-full items-center justify-center divide-x divide-solid'>

            <div className='flex flex-col h-full w-1/5 items-center justify-center'>
                <TimerPane />
            </div>

            <div className='flex flex-col h-full w-4/5'>
                <SelectedQuestionBottomPane />
            </div>
        </div>
    )
}


const SelectedQuestionBottomPane = ({ }) => {
    const game = useGameContext();

    switch (game.status) {
        case 'question_active':
            return <QuestionActiveBottomPane />
        case 'question_end':
            return <QuestionEndBottomPane />
    }
}