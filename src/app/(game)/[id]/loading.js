import LoadingScreen from '@/app/components/LoadingScreen'

export default function Loading() {
    return (
        <div className='h-screen flex'>
            <LoadingScreen loadingText="Loading game..." />
        </div>
    )
}