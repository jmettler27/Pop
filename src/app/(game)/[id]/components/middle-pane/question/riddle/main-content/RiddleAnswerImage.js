import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'

export default function RiddleAnswerImage({ question }) {
    return <FirebaseImage url={question.details.answer.image} alt={question.details.answer.title} />
}