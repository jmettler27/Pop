import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentOnce } from 'react-firebase-hooks/firestore'

import { clsx } from 'clsx'

import LoadingScreen from '@/app/components/LoadingScreen'
import { THEME_SECTION_TEXT } from '@/lib/utils/question/theme'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'


export default function SpecialThemeActiveMiddlePane({ theme, themeRealtime }) {
    const currentThemeId = theme.id
    const currentSectionId = theme.details.sections[themeRealtime.currentSectionIdx]

    const sectionRef = doc(QUESTIONS_COLLECTION_REF, currentThemeId, 'sections', currentSectionId)
    const [section, sectionLoading, sectionError] = useDocumentData(sectionRef)

    if (sectionError) {
        return <p><strong>Error: {JSON.stringify(sectionError)}</strong></p>
    }
    if (sectionLoading) {
        return <LoadingScreen loadingText="Loading section data..." />
    }
    if (!section) {
        return <></>
    }

    return (
        <div className='h-full flex flex-col items-center'>
            <div className='flex flex-col h-[10%] items-center justify-center'>
                {/* <ThemeTitle theme={theme} /> */}
                <SectionTitle section={section} themeRealtime={themeRealtime} />
            </div>
            <div className='flex h-[90%] w-[80%] items-center justify-center overflow-auto'>
                <SectionQuestions currentThemeId={currentThemeId} currentSectionId={currentSectionId} sectionQuestions={section.questions} />
            </div>
        </div>
    )
}


function SectionTitle({ section, themeRealtime, lang = DEFAULT_LOCALE }) {
    return <h1 className='2xl:text-4xl'><span className='font-bold'>{THEME_SECTION_TEXT[lang]} {themeRealtime.currentSectionIdx + 1}</span>{section.title && `: ${section.title}`}</h1>
}

function SectionQuestions({ currentThemeId, currentSectionId, sectionQuestions }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const sectionRealtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', currentThemeId, 'sections', currentSectionId)
    const [sectionRealtime, sectionRealtimeLoading, sectionRealtimeError] = useDocumentData(sectionRealtimeRef)
    if (sectionRealtimeError) {
        return <p><strong>Error: {JSON.stringify(sectionRealtimeError)}</strong></p>
    }
    if (sectionRealtimeLoading) {
        return <LoadingScreen loadingText="Loading section realtime data..." />
    }
    if (!sectionRealtime) {
        return <></>
    }
    const currentQuestionIdx = sectionRealtime.currentQuestionIdx

    const isOrganizer = (myRole === 'organizer')
    const myIndex = isOrganizer ? sectionQuestions.length - 1 : currentQuestionIdx

    // Organizer: show everything

    const statusToColor = (status, idx) => {
        if (status === 'correct') // Question has been answered correctly
            return 'text-green-600'
        else if (status === 'wrong') // Question has been answered incorrectly
            return 'text-red-600'
        else // Question not answered yet
            return (isOrganizer && idx === currentQuestionIdx) && 'text-orange-300'
    }

    return (
        <div className='flex flex-col space-y-10'>
            {sectionQuestions.map((question, idx) => {
                const status = sectionRealtime.question_status[idx]
                return (
                    <div key={idx} className={clsx(
                        !(idx <= myIndex) && 'opacity-0'
                    )}>
                        {/* Question */}
                        <p className={clsx(
                            '2xl:text-3xl font-bold',
                            statusToColor(status, idx)
                        )}>
                            {question.title}
                        </p>

                        {/* Answer */}
                        <p className={clsx(
                            '2xl:text-3xl italic',
                            !(status || isOrganizer) && 'opacity-0'
                        )}>
                            {question.answer}
                        </p>
                    </div>
                )
            })
            }
        </div>
    )

}