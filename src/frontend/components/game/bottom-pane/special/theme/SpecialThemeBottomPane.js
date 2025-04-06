import { useGameContext } from '@/frontend/contexts'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument, useDocumentData, useDocumentOnce } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/frontend/components/LoadingScreen'
import SpecialThemeActiveBottomPane from '@/frontend/components/game/bottom-pane/special/theme/theme-active/SpecialThemeActiveBottomPane'
import SpecialThemeEndBottomPane from '@/frontend/components/game/bottom-pane/special/theme/theme-end/SpecialThemeEndBottomPane'

import { SpecialRoundStatus } from '@/backend/models/rounds/Special'


export default function SpecialThemeBottomPane({ round }) {
    const game = useGameContext()

    const currentThemeId = round.currentTheme
    const baseThemeRef = doc(QUESTIONS_COLLECTION_REF, currentThemeId)
    const gameThemeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', currentThemeId)

    const [baseThemeDoc, baseThemeLoading, baseThemeError] = useDocumentOnce(baseThemeRef)
    const [gameThemeDoc, gameThemeLoading, gameThemeError] = useDocument(gameThemeRef)
    if (baseThemeError) {
        return <p><strong>Error: {JSON.stringify(baseThemeError)}</strong></p>
    }
    if (gameThemeError) {
        return <p><strong>Error: {JSON.stringify(gameThemeError)}</strong></p>
    }
    if (baseThemeLoading || gameThemeLoading) {
        return <LoadingScreen loadingText="Loading..." />
    }
    if (!baseThemeDoc || !gameThemeDoc) {
        return <></>
    }

    const baseTheme = { id: baseThemeDoc.id, ...baseThemeDoc.data() }
    const gameTheme = { id: gameThemeDoc.id, ...gameThemeDoc.data() }

    switch (round.status) {
        case SpecialRoundStatus.THEME_ACTIVE:
            return <SpecialThemeActiveBottomPane baseTheme={baseTheme} gameTheme={gameTheme} />
        case SpecialRoundStatus.THEME_END:
            return <SpecialThemeEndBottomPane />
    }
}
