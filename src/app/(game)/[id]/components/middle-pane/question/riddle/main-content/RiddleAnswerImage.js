import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'

export default function RiddleAnswerImage({ question }) {
    switch (question.type) {
        case 'emoji':
            return <EmojiAnswerImage question={question} />
        default:
            return <FirebaseImage url={question.details.answer.image} alt={question.details.answer.title} />
    }
}


function EmojiAnswerImage({ question }) {
    return (
        <div className='flex flex-col h-full justify-between'>
            <FirebaseImage
                url={question.details.answer.image}
                alt={question.details.answer.title}
                height={'90%'}
            />

            {/* <FirebaseImage url={question.details.answer.image} alt={question.details.answer.title} /> */}
            <p className='text-5xl text-center'>{question.details.clue}</p>
        </div>
    )
}