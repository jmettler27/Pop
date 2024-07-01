import { useUserContext } from '@/app/contexts'
import { useGameContext, useTeamContext } from '@/app/(game)/contexts'

import { Button, ButtonGroup, CircularProgress } from '@mui/material'

import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import MCQPlayerOptionHelperText from '@/app/(game)/[id]/components/bottom-pane/question/question-active/mcq/MCQPlayerOptionHelperText';
import { selectConditionalMCQOption } from '@/app/(game)/lib/question/mcq'

import { MCQ_OPTION_TO_ICON, mcqOptionToTitle } from '@/lib/utils/question/mcq'
import { useAsyncAction } from '@/lib/utils/async';

export default function MCQPlayerController({ chooserTeamId, realtime, question }) {
    const { subtype } = question.details

    return <>
        {subtype === 'immediate' && <ImmediateMCQPlayerController chooserTeamId={chooserTeamId} />}
        {subtype === 'conditional' && <ConditionalMCQPlayerController chooserTeamId={chooserTeamId} realtime={realtime} />}
    </>
}


function ImmediateMCQPlayerController({ chooserTeamId }) {
    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
        </div>
    )
}

function ConditionalMCQPlayerController({ chooserTeamId, realtime }) {
    const myTeam = useTeamContext()
    const isChooser = myTeam === chooserTeamId

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-3'>
            {realtime.option !== null && <span className='2xl:text-4xl font-bold'><MCQPlayerOptionHelperText realtime={realtime} /></span>}
            {realtime.option === null && (
                <>
                    <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
                    {isChooser && <ConditionalMCQChooserController />}
                </>
            )}
        </div>
    )
}

function ConditionalMCQChooserController() {
    const game = useGameContext()
    const user = useUserContext()

    const [handleSelectOption, isSelecting] = useAsyncAction(async (optionIdx) => {
        await selectConditionalMCQOption(game.id, game.currentRound, game.currentQuestion, user.id, optionIdx)
    })

    return (
        <ButtonGroup
            disableElevation
            variant='contained'
            size='large'
        >
            {/* Hide */}
            <Button
                color='success'
                startIcon={MCQ_OPTION_TO_ICON['hide']}
                onClick={() => handleSelectOption(0)}
                disabled={isSelecting}
            >
                {mcqOptionToTitle('hide')}
            </Button>

            {/* Square */}
            <Button
                color='warning'
                startIcon={MCQ_OPTION_TO_ICON['square']}
                onClick={() => handleSelectOption(1)}
                disabled={isSelecting}
            >
                {mcqOptionToTitle('square')}
            </Button>

            {/* Duo */}
            <Button
                color='error'
                startIcon={MCQ_OPTION_TO_ICON['duo']}
                onClick={() => handleSelectOption(2)}
                disabled={isSelecting}
            >
                {mcqOptionToTitle('duo')}
            </Button>
        </ButtonGroup>
    )
}