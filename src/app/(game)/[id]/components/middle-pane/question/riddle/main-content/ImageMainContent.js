import { useGameContext, useRoleContext } from '@/app/(game)/contexts'
import { QUESTION_ELEMENT_TO_EMOJI } from '@/lib/utils/question/question'

import { Box } from '@mui/material'

import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'

export default function ImageMainContent({ question }) {
    const { image, answer: { description, source } } = question.details

    return (
        <Box className='flex flex-row h-full w-[90%] items-center justify-center space-x-8'>
            <Box className='flex flex-col h-3/4 max-w-1/2 items-end justify-end'>
                <FirebaseImage url={image} alt="???" />
            </Box>
            <Box className='flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2'>
                {description && <span className='2xl:text-4xl dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['description']} {<DisplayedImageElement element={description} />}</span>}
                {source && <span className='2xl:text-4xl dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['source']} <i>{<DisplayedImageElement element={source} />}</i></span>}
            </Box>
        </Box>
    )
}

const DisplayedImageElement = ({ element }) => {
    const game = useGameContext()
    const myRole = useRoleContext()

    if (game.status === 'question_end' || myRole === 'organizer') {
        return <span className='text-green-500'>{element}</span>;
    }

    return <span className='text-yellow-500'>???</span>;
}