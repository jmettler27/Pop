import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc, increment } from 'firebase/firestore'
import { useCollectionData, useDocument, useDocumentData } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'


export default function FinaleThemeEndMiddlePane({ theme, themeRealtime }) {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="h-[10%] flex flex-col items-center justify-center">
                <ThemeTitle theme={theme} themeRealtime={themeRealtime} />
            </div>
            <div className="h-[90%] w-full flex items-center justify-center">
                <ThemeScores themeId={theme.id} />
            </div>
        </div>
    )

}

function ThemeTitle({ theme, themeRealtime, lang = 'fr-FR' }) {
    return <h1 className='2xl:text-4xl font-bold'>{THEME_END_TEXT[lang]} {themeRealtime.order + 1} ({theme.details.title})</h1>
}

const THEME_END_TEXT = {
    'en': "End of theme",
    'fr-FR': "Fin du thème"
}

function ThemeScores({ themeId, lang = 'fr-FR' }) {
    const game = useGameContext()

    const [sectionRealtimes, sectionRealtimesLoading, sectionRealtimesError] = useCollectionData(collection(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', themeId, 'sections'))

    if (sectionRealtimesLoading) {
        return <LoadingScreen loadingText="Loading sectionRealtimes..." />
    }
    if (sectionRealtimesError) {
        return <p><strong>Error: {JSON.stringify(sectionRealtimesError)}</strong></p>
    }
    if (!sectionRealtimes) {
        return <></>
    }

    const totalCounts = sectionRealtimes.reduce((acc, realtime) => {
        const counts = realtime.question_status.reduce((acc, status) => {
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