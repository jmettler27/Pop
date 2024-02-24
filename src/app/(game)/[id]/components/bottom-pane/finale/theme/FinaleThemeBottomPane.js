import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument, useDocumentData, useDocumentOnce } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'
import FinaleThemeActiveBottomPane from './theme-active/FinaleThemeActiveBottomPane'
import FinaleThemeEndBottomPane from './theme-end/FinaleThemeEndBottomPane'

export default function FinaleThemeBottomPane({ round }) {
    const game = useGameContext()

    const currentThemeId = round.currentTheme
    const themeDocRef = doc(QUESTIONS_COLLECTION_REF, currentThemeId)
    const themeRealtimeDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', currentThemeId)

    const [themeDoc, themeLoading, themeError] = useDocumentOnce(themeDocRef)
    const [themeRealtimeDoc, realtimeLoading, realtimeError] = useDocument(themeRealtimeDocRef)
    if (themeError) {
        return <p><strong>Error: {JSON.stringify(themeError)}</strong></p>
    }
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(sectionError)}</strong></p>
    }
    if (themeLoading || realtimeLoading) {
        return <LoadingScreen loadingText="Loading..." />
    }
    if (!themeDoc || !themeRealtimeDoc) {
        return <></>
    }

    const theme = { id: themeDoc.id, ...themeDoc.data() }
    const themeRealtime = { id: themeRealtimeDoc.id, ...themeRealtimeDoc.data() }

    switch (round.status) {
        case 'theme_active':
            return <FinaleThemeActiveBottomPane theme={theme} themeRealtime={themeRealtime} />
        case 'theme_end':
            return <FinaleThemeEndBottomPane />
    }
}
