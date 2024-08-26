import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import { handleSpecialPlayerAnswer, handleSpecialQuestionEndOrganizerContinue } from '@/app/(game)/lib/question/special'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement'

import { DEFAULT_LOCALE } from '@/lib/utils/locales'
import { useAsyncAction } from '@/lib/utils/async'
import { INVALIDATE_ANSWER, VALIDATE_ANSWER } from '@/lib/utils/question/question'

export default function SpecialThemeActiveBottomPane({ theme, themeRealtime }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case 'organizer':
            return <SpecialThemeActiveOrganizerBottomPane theme={theme} themeRealtime={themeRealtime} />
        default:
            return <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={themeRealtime.teamId} /></span>
    }

}

function SpecialThemeActiveOrganizerBottomPane({ theme, themeRealtime }) {
    const game = useGameContext()

    const { currentSectionIdx } = themeRealtime
    const currentSectionId = theme.details.sections[currentSectionIdx]

    const sectionRealtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', theme.id, 'sections', currentSectionId)
    const [sectionRealtimeDoc, sectionLoading, sectionError] = useDocument(sectionRealtimeRef)
    if (sectionError) {
        return <p><strong>Error: {JSON.stringify(sectionError)}</strong></p>
    }
    if (sectionLoading) {
        return <></>
    }
    if (!sectionRealtimeDoc) {
        return <></>
    }
    const sectionRealtime = { id: sectionRealtimeDoc.id, ...sectionRealtimeDoc.data() }


    switch (sectionRealtime.status) {
        case 'question_active':
            return <SpecialQuestionActiveOrganizerBottomPane themeRealtime={themeRealtime} />
        case 'question_end':
            return <SpecialQuestionEndOrganizerBottomPane theme={theme} themeRealtime={themeRealtime} sectionRealtime={sectionRealtime} />
    }
}

function SpecialQuestionActiveOrganizerBottomPane({ themeRealtime, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handlePlayerAnswer, isHandling] = useAsyncAction(async (invalidate) => {
        await handleSpecialPlayerAnswer(game.id, game.currentRound, themeRealtime.id, invalidate, user.id)
    })

    return (
        <ButtonGroup
            disableElevation
            variant='contained'
            size='large'
            color='primary'
        >
            {/* Validate the player's answer */}
            <Button
                color='success'
                startIcon={<CheckCircleIcon />}
                onClick={() => { handlePlayerAnswer(false) }}
                disabled={isHandling}
            >
                {VALIDATE_ANSWER[lang]}
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={() => { handlePlayerAnswer(true) }}
                disabled={isHandling}
            >
                {INVALIDATE_ANSWER[lang]}
            </Button>
        </ButtonGroup>
    )
}


function SpecialQuestionEndOrganizerBottomPane({ theme, themeRealtime, sectionRealtime }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleContinue, isHandling] = useAsyncAction(async () => {
        await handleSpecialQuestionEndOrganizerContinue(game.id, game.currentRound, theme.id, sectionRealtime.id, isLastQuestionInSection, isLastSectionInTheme, user.id)
    })

    const isLastQuestionInSection = sectionRealtime.currentQuestionIdx === sectionRealtime.question_status.length - 1
    const isLastSectionInTheme = themeRealtime.currentSectionIdx === theme.details.sections.length - 1

    const continueButtonText = () => {
        if (!isLastQuestionInSection)
            return "Next Question"
        if (!isLastSectionInTheme)
            return "Next Section"
        return "Score Summary"
    }

    return (
        <Button
            variant='contained'
            endIcon={<ArrowRightIcon />}
            onClick={handleContinue}
            disabled={isHandling}
        >
            {continueButtonText()}
        </Button>
    )
}