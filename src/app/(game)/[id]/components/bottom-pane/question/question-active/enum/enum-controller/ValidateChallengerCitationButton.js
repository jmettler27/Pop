import { useUserContext } from '@/app/contexts';
import { useGameContext } from '@/app/(game)/contexts'

import { CircularProgress, IconButton, Tooltip } from '@mui/material'
import PlusOneIcon from '@mui/icons-material/PlusOne';

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { incrementChallengerNumCorrect } from '@/app/(game)/lib/question/enum';
import { useAsyncAction } from '@/lib/utils/async';

export default function ValidateChallengerCitationButton() {
    const game = useGameContext()
    const user = useUserContext()

    const [handleClick, isSubmitting] = useAsyncAction(async () => {
        await incrementChallengerNumCorrect(game.id, game.currentRound, game.currentQuestion, user.id)
    })

    const timerDocRef = doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'timer')
    const [timer, timerLoading, timerError] = useDocumentData(timerDocRef)

    if (timerError) {
        return <p><strong>Error: </strong>{JSON.stringify(timerError)}</p>
    }
    if (timerLoading) {
        return <CircularProgress />
    }
    if (!timer) {
        return <></>
    }

    const isClickable = timer.status === 'start'

    return (
        <Tooltip
            title={isClickable ? "Valider la citation" : "Active le timer d'abord !"}
            placement='right'
        >
            <span>
                <IconButton
                    variant='contained'
                    color='success'
                    size='medium'
                    onClick={handleClick}
                    disabled={!isClickable || isSubmitting}
                >
                    <PlusOneIcon />
                </IconButton>
            </span>
        </Tooltip>
    )
}