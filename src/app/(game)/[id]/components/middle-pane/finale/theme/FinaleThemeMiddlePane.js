import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentOnce } from 'react-firebase-hooks/firestore'

import FinaleThemeActiveMiddlePane from './theme-active/FinaleThemeActiveMiddlePane'
import FinaleThemeEndMiddlePane from './theme-end/FinaleThemeEndMiddlePane'
import LoadingScreen from '@/app/components/LoadingScreen'

export default function FinaleThemeMiddlePane({ round }) {
    const game = useGameContext()
    const themeId = round.currentTheme

    const themeDocRef = doc(QUESTIONS_COLLECTION_REF, themeId)
    const themeRealtimeDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', themeId)

    const [themeDoc, themeLoading, themeError] = useDocumentOnce(themeDocRef)
    const [themeRealtime, themeRealtimeLoading, themeRealtimeError] = useDocumentData(themeRealtimeDocRef)
    if (themeError) {
        return <p><strong>Error: {JSON.stringify(themeError)}</strong></p>
    }
    if (themeRealtimeError) {
        return <p><strong>Error: {JSON.stringify(themeRealtimeError)}</strong></p>
    }
    if (themeLoading || themeRealtimeLoading) {
        return <LoadingScreen loadingText="Loading theme data and states..." />
    }
    if (!themeDoc || !themeRealtime) {
        return <></>
    }
    const theme = { id: themeDoc.id, ...themeDoc.data() }


    switch (round.status) {
        case 'theme_active':
            return <FinaleThemeActiveMiddlePane theme={theme} themeRealtime={themeRealtime} />
        case 'theme_end':
            return <FinaleThemeEndMiddlePane theme={theme} themeRealtime={themeRealtime} />
    }
}