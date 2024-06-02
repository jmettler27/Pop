import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage'

export default function ImageMainContent({ question }) {
    return (
        <div className='h-4/5'>
            <FirebaseImage url={question.details.image} />
        </div>
    )
}
