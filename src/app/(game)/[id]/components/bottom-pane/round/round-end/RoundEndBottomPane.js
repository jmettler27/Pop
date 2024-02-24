
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import GameChooserTeamAnnouncement from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement'
import GoGameHomeButton from '@/app/(game)/[id]/components/bottom-pane/GoGameHomeButton'
import EndGameButton from '@/app/(game)/[id]/components/bottom-pane/EndGameButton'
import { updateGameStatus } from '@/app/(game)/lib/game'
import { useAsyncAction } from '@/lib/utils/async'

export default function RoundEndBottomPane({ endedRound, lang = 'en' }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const [handleClick, isHandling] = useAsyncAction(async () => {
        await updateGameStatus(game.id, 'game_home')
    })

    return (
        <div className='flex flex-col h-full justify-around items-center'>
            <span className='text-4xl font-bold'><GameChooserTeamAnnouncement /> {ROUND_TEXT[lang]} {(endedRound.order + 1) + 1}</span>
            {myRole === 'organizer' && (endedRound.type === 'finale' ?
                <EndGameButton /> :
                <GoGameHomeButton onClick={handleClick} disabled={isHandling} />
            )}
        </div>
    )
}

const ROUND_TEXT = {
    'en': "the round",
    'fr-FR': "la manche"
}
