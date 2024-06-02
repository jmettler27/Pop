import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument, useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import LoadingScreen from '@/app/components/LoadingScreen'
import { handleFinalePlayerAnswer, handleFinaleQuestionEndOrganizerContinue } from '@/app/(game)/lib/question/finale'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement'
import { useAsyncAction } from '@/lib/utils/async'

export default function FinaleThemeActiveBottomPane({ theme, themeRealtime }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case 'organizer':
            return <FinaleThemeActiveOrganizerBottomPane theme={theme} themeRealtime={themeRealtime} />
        default:
            return <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={themeRealtime.teamId} /></span>
    }

}

function FinaleThemeActiveOrganizerBottomPane({ theme, themeRealtime }) {
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
            return <FinaleQuestionActiveOrganizerBottomPane themeRealtime={themeRealtime} />
        case 'question_end':
            return <FinaleQuestionEndOrganizerBottomPane theme={theme} themeRealtime={themeRealtime} sectionRealtime={sectionRealtime} />
    }
}

function FinaleQuestionActiveOrganizerBottomPane({ themeRealtime }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handlePlayerAnswer, isHandling] = useAsyncAction(async (invalidate) => {
        await handleFinalePlayerAnswer(game.id, game.currentRound, themeRealtime.id, invalidate, user.id)
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
                Validate
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={() => { handlePlayerAnswer(true) }}
                disabled={isHandling}
            >
                Cancel
            </Button>
        </ButtonGroup>
    )
}


function FinaleQuestionEndOrganizerBottomPane({ theme, themeRealtime, sectionRealtime }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleContinue, isHandling] = useAsyncAction(async () => {
        await handleFinaleQuestionEndOrganizerContinue(game.id, game.currentRound, theme.id, sectionRealtime.id, isLastQuestionInSection, isLastSectionInTheme, user.id)
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