import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore';

import LoadingScreen from '@/app/components/LoadingScreen';
import GameChooserTeamAnnouncement from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import GameChooserOrder from '@/app/(game)/[id]/components/GameChooserOrder';
import FinaleThemeBottomPane from '@/app/(game)/[id]/components/bottom-pane/finale/theme/FinaleThemeBottomPane';

export default function FinaleBottomPane() {

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>
            {/* Left part: controller */}
            <div className='basis-3/4 flex flex-col items-center justify-center'>
                <FinaleController />
            </div>

            {/* Right part: list of riddle players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <FinaleChooserOrder />
            </div>
        </div>
    )
}

function FinaleController() {
    const game = useGameContext()

    const [round, roundLoading, roundError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <LoadingScreen loadingText="Loading round info..." />
    }
    if (!round) {
        return <></>
    }

    switch (round.status) {
        case 'finale_home':
            return <span className='2xl:text-4xl font-bold'><GameChooserTeamAnnouncement /></span>
        case 'theme_active':
        case 'theme_end':
            return <FinaleThemeBottomPane round={round} />
    }

}


function FinaleChooserOrder() {
    const game = useGameContext()

    const [gameStates, statesLoading, statesError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'states'))
    if (statesError) {
        return <p><strong>Error: {JSON.stringify(statesError)}</strong></p>
    }
    if (statesLoading) {
        return <></>
    }
    if (!gameStates) {
        return <></>
    }

    return <GameChooserOrder gameStates={gameStates} />
}