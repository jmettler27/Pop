import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { collection } from 'firebase/firestore'
import { useCollectionDataOnce } from 'react-firebase-hooks/firestore';

import LoadingScreen from '@/app/components/LoadingScreen'
import GoFinaleHomeButton from '@/app/(game)/[id]/components/bottom-pane/finale/theme/theme-end/GoFinaleHomeButton'
import EndGameButton from '@/app/(game)/[id]/components/bottom-pane/EndGameButton'


export default function FinaleThemeEndBottomPane({ }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case 'organizer':
            return <FinaleThemeEndOrganizerBottomPane />
    }
}


function FinaleThemeEndOrganizerBottomPane({ }) {
    const game = useGameContext()

    const [themeRealtimes, realtimesLoading, realtimesError] = useCollectionDataOnce(collection(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes'))
    if (realtimesLoading) {
        return <LoadingScreen loadingText="Loading themes..." />
    }
    if (realtimesError) {
        return <p><strong>Error: {JSON.stringify(realtimesError)}</strong></p>
    }
    if (!themeRealtimes) {
        return <></>
    }

    const isLastTheme = themeRealtimes.every(realtime => realtime.order !== null);

    return (isLastTheme ? <EndGameButton /> : <GoFinaleHomeButton />)
}