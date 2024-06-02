
import ProgressiveCluesMainContent from './main-content/ProgressiveCluesMainContent'
import ImageMainContent from './main-content/ImageMainContent'
import BlindtestMainContent from './main-content/BlindtestMainContent'
import EmojiMainContent from './main-content/EmojiMainContent'

export default function RiddleMainContent({ question, showComplete }) {

    switch (question.type) {
        case 'progressive_clues':
            return <ProgressiveCluesMainContent question={question} showComplete={showComplete} />
        case 'image':
            return <ImageMainContent question={question} />
        case 'blindtest':
            return <BlindtestMainContent question={question} />
        case 'emoji':
            return <EmojiMainContent question={question} />
        default:
            return <p>Unknown round type</p>
    }
}