import { useGameContext, useRoleContext } from '@/app/(game)/contexts'
import { QUESTION_ELEMENT_TO_EMOJI } from '@/lib/utils/question/question'
import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'

export default function ImageMainContent({ question }) {
    const { image, answer: { description, source } } = question.details

    return (
        <div className='flex flex-col h-full w-2/3 items-center justify-center space-y-5'>
            <FirebaseImage url={image} alt='???' height='80%' />
            {description && <h4 className='2xl:text-4xl dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['description']} {<DisplayedImageElement element={description} />}</h4>}
            {source && <h4 className='2xl:text-4xl dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['source']} <i>{<DisplayedImageElement element={source} />}</i></h4>}
        </div>
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