import { useUserContext } from '@/app/contexts'
import { useGameContext, useTeamContext } from '@/app/(game)/contexts'

import { Button, ButtonGroup, CircularProgress } from '@mui/material'

import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import MCQPlayerOptionHelperText from '@/app/(game)/[id]/components/bottom-pane/question/question-active/mcq/MCQPlayerOptionHelperText';
import { handleSubmitOptionPlayer } from '@/app/(game)/lib/question/mcq'

import { MCQ_OPTION_TO_ICON, mcqOptionToTitle } from '@/lib/utils/question/mcq'
import { useAsyncAction } from '@/lib/utils/async';

export default function MCQPlayerController({ chooserTeamId, realtime }) {
    const myTeam = useTeamContext()
    const isChooser = myTeam === chooserTeamId

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-3'>
            {realtime.option !== null && <span className='2xl:text-4xl font-bold'><MCQPlayerOptionHelperText realtime={realtime} /></span>}
            {realtime.option === null && (
                <>
                    <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
                    {isChooser && <MCQChooserController />}

                </>
            )}
        </div>
    )
}

function MCQChooserController() {
    const game = useGameContext()
    const user = useUserContext()

    const [handleOptionClick, isSubmitting] = useAsyncAction(async (optionIdx) => {
        await handleSubmitOptionPlayer(game.id, game.currentRound, game.currentQuestion, user.id, optionIdx)
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
                onClick={() => handleOptionClick(0)}
                disabled={isSubmitting}
            >
                {mcqOptionToTitle('hide')}
            </Button>

            {/* Square */}
            <Button
                color='warning'
                startIcon={MCQ_OPTION_TO_ICON['square']}
                onClick={() => handleOptionClick(1)}
                disabled={isSubmitting}
            >
                {mcqOptionToTitle('square')}
            </Button>

            {/* Duo */}
            <Button
                color='error'
                startIcon={MCQ_OPTION_TO_ICON['duo']}
                onClick={() => handleOptionClick(2)}
                disabled={isSubmitting}
            >
                {mcqOptionToTitle('duo')}
            </Button>
        </ButtonGroup>
    )
}