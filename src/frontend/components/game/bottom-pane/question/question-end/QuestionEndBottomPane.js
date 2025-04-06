import { UserRole } from '@/backend/models/users/User'

import { handleQuestionEnd } from '@/backend/services/round/round-transitions';


import { useGameContext, useRoleContext, useGameRepositoriesContext } from '@/frontend/contexts'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { Button } from '@mui/material'
import FastForwardIcon from '@mui/icons-material/FastForward'
import ScoreboardIcon from '@mui/icons-material/Scoreboard'
import ReadyPlayerController from '@/frontend/components/game/bottom-pane/ReadyPlayerController';


export default function QuestionEndBottomPane({ }) {
    const game = useGameContext();

    const { roundRepo } = useGameRepositoriesContext()
    const { round, roundLoading, roundError } = roundRepo.useRoundOnce(game.currentRound)

    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <></>
    }
    if (!round) {
        return <></>
    }

    const isLastQuestion = round.currentQuestionIdx === round.questions.length - 1

    return <QuestionEndController isLastQuestion={isLastQuestion} />
}

function QuestionEndController({ isLastQuestion }) {
    const myRole = useRoleContext();

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-5'>
            <ReadyPlayerController isLastQuestion={isLastQuestion} />
            {myRole === UserRole.ORGANIZER && <QuestionEndOrganizerButton isLastQuestion={isLastQuestion} />}
        </div>
    )
}



function QuestionEndOrganizerButton({ isLastQuestion, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleContinueClick, isEnding] = useAsyncAction(async () => {
        await handleQuestionEnd(game.id, game.currentRound, game.currentQuestion)
    })

    return (
        <Button
            className='rounded-full'
            color='secondary'
            size='large'
            variant='contained'
            onClick={handleContinueClick}
            disabled={isEnding}
            startIcon={isLastQuestion ? <ScoreboardIcon /> : <FastForwardIcon />}
        >
            {isLastQuestion ? QUESTION_END_ORGANIZER_ROUND_END_TEXT[lang] : QUESTION_END_ORGANIZER_NEXT_QUESTION_TEXT[lang]}
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