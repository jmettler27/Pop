import { useGameContext } from '@/app/(game)/contexts'

import RiddleAnswerImage from './RiddleAnswerImage'

export default function EmojiMainContent({ question }) {
    const game = useGameContext()

    return game.status === 'question_end' ?
        <RiddleAnswerImage question={question} /> :
        <span className='text-9xl'>{question.details.clue}</span>
}
