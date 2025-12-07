import { useGameContext } from '@/frontend/contexts'

import NextImage from '@/frontend/components/game/NextImage'
import { Box } from '@mui/material'
import { GameStatus } from '@/backend/models/games/GameStatus'

export default function EmojiMainContent({ baseQuestion }) {
    const game = useGameContext()

    return <>
        {game.status === GameStatus.QUESTION_ACTIVE && <ActiveEmojiMainContent baseQuestion={baseQuestion} />}
        {game.status === GameStatus.QUESTION_END && <EndedEmojiMainContent baseQuestion={baseQuestion} />}
    </>

}

function ActiveEmojiMainContent({ baseQuestion }) {
    return <span className='text-9xl'>{baseQuestion.clue}</span>
}

function EndedEmojiMainContent({ baseQuestion }) {
    const { clue, image, title } = baseQuestion.answer

    if (!image) {
        return (
            <Box className='flex flex-col h-3/4 max-w-1/2 items-center justify-center space-y-2'>
                <span className='text-9xl'>{clue}</span>
                <span className='text-4xl text-green-500'><strong>{title}</strong></span>
            </Box>
        )
    }

    return (
        <Box className='flex flex-row h-full w-[90%] items-center justify-center space-x-8'>
            <Box className='flex flex-col h-3/4 max-w-1/2 items-end justify-end'>
                <NextImage url={image} alt={title} />
            </Box>
            <Box className='flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2'>
                <span className='text-7xl'>{clue}</span>
                <span className='text-4xl text-green-500'><strong>{title}</strong></span>
            </Box>
        </Box>
    )
}
