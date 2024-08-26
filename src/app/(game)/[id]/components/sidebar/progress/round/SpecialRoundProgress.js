import { useState, useEffect } from 'react'
import { useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc, collection, query, where, orderBy } from 'firebase/firestore'
import { useDocumentData, useCollectionData, useCollection, useCollectionOnce, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { CircularProgress } from '@mui/material'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import clsx from 'clsx'
import LoadingScreen from '@/app/components/LoadingScreen'
import { THEME_SECTION_TEXT, THEME_TEXT } from '@/lib/utils/question/theme'
import { topicToEmoji } from '@/lib/utils/topics'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'


export default function SpecialRoundProgress({ game, round }) {
    switch (round.status) {
        case 'special_home':
            return <SpecialRoundHomeProgress round={round} />
        case 'theme_active':
        case 'theme_end':
            return <SpecialRoundThemeProgress game={game} round={round} />
    }
}

/**
 * Sidebar visible in the special round home screen
 */
function SpecialRoundHomeProgress({ round, lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()

    const themeRealtimesCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'themes')
    const [themeRealtimes, themeRealtimesLoading, themeRealtimesError] = useCollection(query(themeRealtimesCollectionRef, where('order', '!=', null), orderBy('order', 'asc')))

    const [teams, teamsLoading, teamsError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'teams'))

    if (themeRealtimesError) {
        return <p><strong>Error: {JSON.stringify(themeRealtimesError)}</strong></p>
    }
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (themeRealtimesLoading || teamsLoading) {
        return <CircularProgress />
    }
    if (!themeRealtimes || !teams) {
        return <></>
    }

    const sortedThemeRealtimes = themeRealtimes.docs.map((doc) => ({ id: doc.id, ...doc.data() }))


    return (
        <div className='w-full m-1 p-1'>
            {sortedThemeRealtimes.map((themeRealtime) => {
                const themeHasEnded = themeRealtime.dateEnd != null
                const themeIsCurrent = themeRealtime.id === round.currentTheme

                const playerTeamId = themeRealtime.teamId
                const playerTeam = playerTeamId ? teams.docs.find(doc => doc.id === playerTeamId).data() : null


                return (
                    <Accordion
                        key={themeRealtime.id}
                        expanded={true}
                        disableGutters
                        elevation={0}
                        className={`text-inherit bg-inherit`}
                        sx={{
                            border: `0.5px solid ${(playerTeam) && playerTeam.color}}`,
                        }}
                    >
                        <AccordionSummary
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            <Typography className={clsx(
                                themeIsCurrent && 'text-orange-300',
                            )}>
                                <span className='font-bold'>{THEME_TEXT[lang]} {themeRealtime.order + 1}</span>: {themeRealtime.title}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Team: {playerTeam ? playerTeam.name : 'None'}
                            </Typography>
                            <Typography>
                                Score: {themeRealtime.score}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                )
            })}

        </div>
    )
}

/**
 * Sidebar visible in a special round theme
 */
function SpecialRoundThemeProgress({ round, lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()
    const themeId = round.currentTheme

    const sectionRealtimesRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'themes', themeId, 'sections')
    const [sectionRealtimes, sectionRealtimesLoading, sectionRealtimesError] = useCollection(query(sectionRealtimesRef))

    const themeRealtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'themes', themeId)
    const [themeRealtime, themeRealtimeLoading, themeRealtimeError] = useDocumentData(themeRealtimeRef)

    const themeRef = doc(QUESTIONS_COLLECTION_REF, themeId)
    const [theme, themeLoading, themeError] = useDocumentDataOnce(themeRef)

    const [teams, teamsLoading, teamsError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'teams'))

    const [expanded, setExpanded] = useState(false)

    // Expand the question's accordion whenever the current question changes or the game status changes (question start -> question_end)
    useEffect(() => {
        if (!themeRealtime || themeRealtime.currentSectionIdx === null)
            return
        setExpanded(themeRealtime.currentSectionIdx)
    }, [themeRealtime])


    if (sectionRealtimesError) {
        return <p><strong>Error: {JSON.stringify(sectionRealtimesError)}</strong></p>
    }
    if (themeRealtimeError) {
        return <p><strong>Error: {JSON.stringify(themeRealtimeError)}</strong></p>
    }
    if (themeError) {
        return <p><strong>Error: {JSON.stringify(themeError)}</strong></p>
    }
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (themeLoading || sectionRealtimesLoading || themeRealtimeLoading || teamsLoading) {
        return <LoadingScreen />
    }
    if (!theme || !sectionRealtimes || !themeRealtime || !teams) {
        return <></>
    }

    const { currentSectionIdx } = themeRealtime
    const currentSectionId = theme.details.sections[currentSectionIdx]


    const sortedSectionRealtimes = theme.details.sections.map((sectionId) => sectionRealtimes.docs.find(doc => doc.id === sectionId)).map((doc) => ({ id: doc.id, ...doc.data() }))
    const currentSectionRealtime = sortedSectionRealtimes.find(section => section.id === currentSectionId)


    const isExpanded = (sectionIdx) =>
        expanded === sectionIdx

    const handleAccordionChange = (sectionIdx) => {
        setExpanded(isExpanded(sectionIdx) ? false : sectionIdx)
    }

    const hasEnded = (idx) => idx < currentSectionIdx
    const isCurrent = (idx) => idx === currentSectionIdx
    const hasNotStarted = (idx) => idx >= currentSectionIdx

    const playerTeamId = themeRealtime.teamId
    const playerTeam = playerTeamId ? teams.docs.find(doc => doc.id === playerTeamId).data() : null

    return (
        <>
            <h2 className='text-lg'>{topicToEmoji(theme.topic)} <strong>{THEME_TEXT[lang]} {themeRealtime.order + 1}</strong>: {theme.details.title}</h2>

            <div className='w-full m-1 px-2'>
                {sortedSectionRealtimes.map((sectionRealtime, idx) => (
                    <ThemeSectionAccordion key={sectionRealtime.id}
                        themeId={themeId}
                        sectionId={sectionRealtime.id}
                        sectionOrder={idx}
                        hasEnded={hasEnded(idx)}
                        isCurrent={isCurrent(idx)}
                        hasNotStarted={hasNotStarted(idx)}
                        onAccordionChange={() => handleAccordionChange(idx)}
                        expanded={isExpanded(idx)}
                        sectionRealtime={sectionRealtime}
                        currentSectionRealtime={currentSectionRealtime}
                        playerTeam={playerTeam}
                    />
                ))}
            </div>
        </>
    )
}


function ThemeSectionAccordion({ themeId, sectionId, sectionOrder, hasEnded, isCurrent, hasNotStarted, onAccordionChange, expanded, sectionRealtime, currentSectionRealtime, playerTeam, lang = DEFAULT_LOCALE }) {
    const myRole = useRoleContext()

    const showComplete = myRole === 'organizer' || hasEnded || isCurrent
    console.log(sectionId, showComplete)

    const borderColor = (() => {
        if (isCurrent) {
            // return 'border-orange-500'
            return '#f97316'
        }
        if (hasNotStarted) {
            // return 'border-gray-500'
            return '#6b7280'
        }
        if (showComplete && playerTeam) {
            return playerTeam.color
        }
    })


    const borderWidth = (() => {
        if (isCurrent) {
            return '2px';
        }
        return '1px'
    })


    return (
        <Accordion
            expanded={expanded}
            onChange={onAccordionChange}
            disabled={!showComplete}

            className='rounded-lg'
            elevation={0}
            sx={{
                borderWidth: borderWidth(),
                borderStyle: 'solid',
                borderColor: borderColor(),
                backgroundColor: 'inherit',
                color: 'inherit'
            }}
            disableGutters
        >
            <AccordionSummary
                expandIcon={showComplete && <ExpandMoreIcon />}
                sx={{
                    '& .MuiSvgIcon-root': {
                        color: borderColor(),
                    }
                }}
            >
                <SectionSummary
                    themeId={themeId}
                    sectionId={sectionId}
                    sectionOrder={sectionOrder}
                    showComplete={showComplete}
                    isCurrent={isCurrent}
                    lang={lang}
                />

            </AccordionSummary>

            <AccordionDetails>
                <SectionDetails
                    sectionRealtime={sectionRealtime}
                    sectionIsCurrent={isCurrent}
                    sectionHasEnded={hasEnded}
                    currentSectionRealtime={currentSectionRealtime}
                    lang={lang} />
            </AccordionDetails>
        </Accordion>
    )

}

function SectionSummary({ themeId, sectionId, sectionOrder, showComplete, isCurrent, lang = DEFAULT_LOCALE }) {
    const sectionRef = doc(QUESTIONS_COLLECTION_REF, themeId, 'sections', sectionId)
    const [section, sectionLoading, sectionError] = useDocumentDataOnce(sectionRef)
    if (sectionError) {
        return <p><strong>Error: {JSON.stringify(sectionError)}</strong></p>
    }
    if (sectionLoading) {
        return <CircularProgress />
    }
    if (!section) {
        return <></>
    }

    return (
        <Typography className={clsx(
            isCurrent && 'text-orange-300',
        )}>
            <span className='text-lg'><strong>{THEME_SECTION_TEXT[lang]} {sectionOrder + 1}</strong>: {section.title && `${(showComplete || isCurrent) ? section.title : '???'}`}</span>
        </Typography>
    )
}

function SectionDetails({ sectionRealtime, sectionIsCurrent, sectionHasEnded, currentSectionRealtime, lang = DEFAULT_LOCALE }) {
    const { currentQuestionIdx } = currentSectionRealtime

    return (
        <ol className='list-decimal list-inside'>
            {sectionRealtime.question_status.map((status, idx) => {
                const questionisCurrent = (sectionIsCurrent && idx === currentQuestionIdx)
                const questionHasEnded = sectionHasEnded || (sectionIsCurrent && idx < currentQuestionIdx) || (questionisCurrent && status === 'question_end')
                const questionHasNotStarted = !questionisCurrent && !questionHasEnded

                return (
                    <li key={idx}
                        className={clsx(
                            questionisCurrent && 'font-bold text-orange-300',
                            questionHasEnded && 'line-through',
                            questionHasNotStarted && 'text-gray-500'
                        )}
                    >
                        Question {idx + 1} {(questionHasEnded && status) && (status === 'correct' ? '✅' : '❌')}
                    </li>
                )
            })}
        </ol>
    )
}
