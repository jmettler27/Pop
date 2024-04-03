import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc, onSnapshot, query } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import ContinuePlayerController from '@/app/(game)/[id]/components/bottom-pane/ContinuePlayerController'
import QuestionEndCountdown from './QuestionEndCountdown'
import QuestionEndWait from './QuestionEndWait'
import QuestionEndOrganizerController from './QuestionEndOrganizerController'


export default function QuestionEndBottomPane({ }) {
    const game = useGameContext();

    const [ready, readyLoading, readyError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'ready'))
    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))

    if (readyError) {
        return <p><strong>Error: {JSON.stringify(readyError)}</strong></p>
    }
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (readyLoading || roundLoading) {
        return <></>
    }
    if (!ready || !round) {
        return <></>
    }

    const allReady = ready.numReady === ready.numPlayers
    const isRoundEnd = round.currentQuestionIdx === round.questions.length - 1

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-5'>
            {allReady ?
                <QuestionEndCountdown isRoundEnd={isRoundEnd} /> :
                <QuestionEndWait isRoundEnd={isRoundEnd} />
            }
            <QuestionEndController isRoundEnd={isRoundEnd} />
        </div>
    )
}

function QuestionEndController({ isRoundEnd }) {
    const myRole = useRoleContext();

    switch (myRole) {
        case 'organizer':
            return <QuestionEndOrganizerController isRoundEnd={isRoundEnd} />
        case 'player':
            return <ContinuePlayerController />
        default:
            return <></>
    }
}
