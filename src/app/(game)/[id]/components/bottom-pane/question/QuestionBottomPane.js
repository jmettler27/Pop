import { useGameContext } from '@/app/(game)/contexts'

import QuestionActiveBottomPane from './question-active/QuestionActiveBottomPane'
import QuestionEndBottomPane from './question-end/QuestionEndBottomPane'

export default function QuestionBottomPane() {
    const game = useGameContext();

    switch (game.status) {
        case 'question_active':
            return <QuestionActiveBottomPane />
        case 'question_end':
            return <QuestionEndBottomPane />
    }
}
