import { QuestionType } from '@/backend/models/questions/QuestionType'

import ProgressiveCluesMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/ProgressiveCluesMainContent'
import ImageMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/ImageMainContent'
import BlindtestMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/BlindtestMainContent'
import EmojiMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/EmojiMainContent'


export default function BuzzerMainContent({ question, showComplete }) {

    switch (question.type) {
        case QuestionType.PROGRESSIVE_CLUES:
            return <ProgressiveCluesMainContent question={question} showComplete={showComplete} />
        case QuestionType.IMAGE:
            return <ImageMainContent question={question} />
        case QuestionType.BLINDTEST:
            return <BlindtestMainContent question={question} />
        case QuestionType.EMOJI:
            return <EmojiMainContent question={question} />
        default:
            return <p>Unknown round type</p>
    }
}