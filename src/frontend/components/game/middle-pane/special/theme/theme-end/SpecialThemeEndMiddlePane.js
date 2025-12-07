import { useGameContext } from '@/frontend/contexts'

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore'
import { collection, doc, increment } from 'firebase/firestore'
import { useCollectionData, useDocument, useDocumentData } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/frontend/components/LoadingScreen'
import { DEFAULT_LOCALE } from '@/frontend/utils/locales'


export default function SpecialThemeEndMiddlePane({ theme, gameTheme }) {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="h-[10%] flex flex-col items-center justify-center">
                <ThemeTitle theme={theme} gameTheme={gameTheme} />
            </div>
            <div className="h-[90%] w-full flex items-center justify-center">
                <ThemeScores themeId={theme.id} />
            </div>
        </div>
    )

}

function ThemeTitle({ theme, gameTheme, lang = DEFAULT_LOCALE }) {
    return <h1 className='2xl:text-4xl font-bold'>{THEME_END_TEXT[lang]} {gameTheme.order + 1} ({theme.details.title})</h1>
}

const THEME_END_TEXT = {
    'en': "End of theme",
    'fr-FR': "Fin du thème"
}

function ThemeScores({ themeId, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [gameSections, gameSectionsLoading, gameSectionsError] = useCollectionData(collection(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', themeId, 'sections'))

    if (gameSectionsLoading) {
        return <LoadingScreen loadingText="Loading gameSections..." />
    }
    if (gameSectionsError) {
        return <p><strong>Error: {JSON.stringify(gameSectionsError)}</strong></p>
    }
    if (!gameSections) {
        return <></>
    }

    const totalCounts = gameSections.reduce((acc, gameSection) => {
        const counts = gameSection.question_status.reduce((acc, status) => {
            if (status === 'correct') {
                acc.correct++
            } else if (status === 'wrong') {
                acc.wrong++
            }
            return acc
        }, { correct: 0, wrong: 0 })
        acc.correct += counts.correct
        acc.wrong += counts.wrong
        return acc
    }
        , { correct: 0, wrong: 0 })

    return <span className='2xl:text-4xl'>{totalCounts.correct} {CORRECT_ANSWER_TEXT[lang]}, <span className='font-bold text-red-600'>{totalCounts.wrong} {WRONG_ANSWER_TEXT[lang]}</span></span>

}

const WRONG_ANSWER_TEXT = {
    'en': "wrong answers",
    'fr-FR': "mauvaises réponses"
}

const CORRECT_ANSWER_TEXT = {
    'en': "correct answers",
    'fr-FR': "bonnes réponses"
}