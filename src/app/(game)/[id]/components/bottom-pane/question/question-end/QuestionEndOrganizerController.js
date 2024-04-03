import { useGameContext } from '@/app/(game)/contexts'

import { useAsyncAction } from '@/lib/utils/async'

import { handleRoundQuestionEnd } from '@/app/(game)/lib/round/round-transitions';

import { Button } from '@mui/material'
import FastForwardIcon from '@mui/icons-material/FastForward'
import ScoreboardIcon from '@mui/icons-material/Scoreboard'


export default function QuestionEndOrganizerController({ isRoundEnd, lang = 'en' }) {
    const game = useGameContext()

    const [handleContinueClick, isEnding] = useAsyncAction(async () => {
        await handleRoundQuestionEnd(game.id, game.currentRound, game.currentQuestion)
    })

    return (
        <Button
            className='rounded-full'
            color='secondary'
            size='large'
            variant='outlined'
            onClick={handleContinueClick}
            disabled={isEnding}
            startIcon={isRoundEnd ? <ScoreboardIcon /> : <FastForwardIcon />}
        >
            {isRoundEnd ? QUESTION_END_ORGANIZER_ROUND_END_TEXT[lang] : QUESTION_END_ORGANIZER_NEXT_QUESTION_TEXT[lang]}
        </Button>
    )

}

const QUESTION_END_ORGANIZER_ROUND_END_TEXT = {
    'en': "End the round",
    'fr-FR': "Terminer la manche"
}

const QUESTION_END_ORGANIZER_NEXT_QUESTION_TEXT = {
    'en': "Switch directly to the next question",
    'fr-FR': "Passer directement à la prochaine question"
}