import { UserRole } from '@/backend/models/users/User'

import { handleQuestionEnd as handleBasicQuestionEnd } from '@/backend/services/round/basic/actions'
import { handleQuestionEnd as handleBlindtestQuestionEnd } from '@/backend/services/round/blindtest/actions'
import { handleQuestionEnd as handleEmojiQuestionEnd } from '@/backend/services/round/emoji/actions'
import { handleQuestionEnd as handleEnumQuestionEnd } from '@/backend/services/round/enumeration/actions'
import { handleQuestionEnd as handleImageQuestionEnd } from '@/backend/services/round/image/actions'
import { handleQuestionEnd as handleLabellingQuestionEnd } from '@/backend/services/round/labelling/actions'
import { handleQuestionEnd as handleMatchingQuestionEnd } from '@/backend/services/round/matching/actions'
import { handleQuestionEnd as handleMCQQuestionEnd } from '@/backend/services/round/mcq/actions'
import { handleQuestionEnd as handleNaguiQuestionEnd } from '@/backend/services/round/nagui/actions'
import { handleQuestionEnd as handleOddOneOutQuestionEnd } from '@/backend/services/round/odd-one-out/actions'
import { handleQuestionEnd as handleProgressiveCluesQuestionEnd } from '@/backend/services/round/progressive-clues/actions'
import { handleQuestionEnd as handleQuoteQuestionEnd } from '@/backend/services/round/quote/actions'
import { handleQuestionEnd as handleReorderingQuestionEnd } from '@/backend/services/round/reordering/actions'


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