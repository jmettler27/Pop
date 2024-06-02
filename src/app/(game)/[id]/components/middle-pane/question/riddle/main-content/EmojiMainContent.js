import { useGameContext } from '@/app/(game)/contexts'

import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'
import { Box } from '@mui/material'

export default function EmojiMainContent({ question }) {
    const game = useGameContext()

    return <>
        {game.status === 'question_active' && <ActiveEmojiMainContent question={question} />}
        {game.status === 'question_end' && <EndedEmojiMainContent question={question} />}
    </>

}


function ActiveEmojiMainContent({ question }) {
    return <span className='2xl:text-9xl'>{question.details.clue}</span>
}

function EndedEmojiMainContent({ question }) {
    const { clue, answer: { image, title } } = question.details

    return (
        <Box className='flex flex-row h-full w-[90%] items-center justify-center space-x-8'>
            <Box className='flex flex-col h-3/4 max-w-1/2 items-end justify-end'>
                <FirebaseImage url={image} alt={title} />
            </Box>
            <Box className='flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2'>
                <span className='2xl:text-7xl'>{clue}</span>
                <span className='2xl:text-4xl text-green-500'><strong>{title}</strong></span>
            </Box>
        </Box>
    )
}
