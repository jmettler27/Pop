import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { collection } from 'firebase/firestore'
import { useCollectionDataOnce } from 'react-firebase-hooks/firestore';

import LoadingScreen from '@/app/components/LoadingScreen'
import GoSpecialHomeButton from '@/app/(game)/[id]/components/bottom-pane/special/theme/theme-end/GoSpecialHomeButton'
import EndGameButton from '@/app/(game)/[id]/components/bottom-pane/EndGameButton'


export default function SpecialThemeEndBottomPane({ }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case 'organizer':
            return <SpecialThemeEndOrganizerBottomPane />
    }
}


function SpecialThemeEndOrganizerBottomPane({ }) {
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

    return (isLastTheme ? <EndGameButton /> : <GoSpecialHomeButton />)
}