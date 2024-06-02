import GameChooserTeamAnnouncement from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement'

export default function GameHomeBottomPane() {
    return (
        <div className='flex flex-col items-center justify-center w-full h-full'>
            <span className='2xl:text-4xl font-bold'><GameChooserTeamAnnouncement /></span>
        </div>
    )
}
