import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import ReadyPlayerController from '@/app/(game)/[id]/components/bottom-pane/ReadyPlayerController';


export default function QuestionEndBottomPane({ }) {
    const game = useGameContext();

    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
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
            {myRole === 'organizer' && <QuestionEndOrganizerController isLastQuestion={isLastQuestion} />}
        </div>
    )
}

import { useAsyncAction } from '@/lib/utils/async'

import { handleRoundQuestionEnd } from '@/app/(game)/lib/round/round-transitions';

import { Button } from '@mui/material'
import FastForwardIcon from '@mui/icons-material/FastForward'
import ScoreboardIcon from '@mui/icons-material/Scoreboard'
import AuthorizePlayersSwitch from '../../AuthorizePlayersSwitch'


function QuestionEndOrganizerController({ isLastQuestion, lang = 'fr-FR' }) {
    return (
        <div className='flex flex-col items-center justify-center h-full w-full'>
            <QuestionEndOrganizerButton isLastQuestion={isLastQuestion} lang={lang} />
            <AuthorizePlayersSwitch lang={lang} />
        </div>
    )
}

function QuestionEndOrganizerButton({ isLastQuestion, lang = 'fr-FR' }) {
    const game = useGameContext()

    const [handleContinueClick, isEnding] = useAsyncAction(async () => {
        await handleRoundQuestionEnd(game.id, game.currentRound, game.currentQuestion)
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