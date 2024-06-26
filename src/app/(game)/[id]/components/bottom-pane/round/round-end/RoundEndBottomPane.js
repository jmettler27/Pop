
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import GameChooserTeamAnnouncement from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement'
import GoGameHomeButton from '@/app/(game)/[id]/components/bottom-pane/GoGameHomeButton'
import EndGameButton from '@/app/(game)/[id]/components/bottom-pane/EndGameButton'
import { roundEndToGameHome } from '@/app/(game)/lib/transitions'

import { useAsyncAction } from '@/lib/utils/async'

import { useParams } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'

export default function RoundEndBottomPane({ endedRound, lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()
    const myRole = useRoleContext()
    const game = useGameContext()

    const [handleClick, isHandling] = useAsyncAction(async () => {
        await roundEndToGameHome(gameId)
    })

    const isFinalRound = endedRound.order === game.rounds.length - 1

    return (
        <div className='flex flex-col h-full justify-around items-center'>
            {!isFinalRound &&
                <span className='2xl:text-4xl font-bold'><GameChooserTeamAnnouncement /> {ROUND_TEXT[lang]} {(endedRound.order + 1) + 1}</span>}
            {myRole === 'organizer' &&
                (isFinalRound ? <EndGameButton /> : <GoGameHomeButton onClick={handleClick} disabled={isHandling} />)}
        </div>
    )
}

const ROUND_TEXT = {
    'en': "the round",
    'fr-FR': "la manche"
}
