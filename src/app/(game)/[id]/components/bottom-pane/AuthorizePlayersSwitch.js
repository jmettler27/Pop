import { useParams } from 'next/navigation'

import { useAsyncAction } from '@/lib/utils/async'

import { CircularProgress, FormControlLabel, Switch } from '@mui/material'
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'
import { switchAuthorizePlayers } from '@/app/(game)/lib/game'
import { doc } from 'firebase/firestore'


export default function AuthorizePlayersSwitch({ authorized, lang = 'fr-FR' }) {
    const { id: gameId } = useParams()

    const [handleAuthorizePlayers, isAuthorizing] = useAsyncAction(async () => {
        await switchAuthorizePlayers(gameId)
    })

    return (
        <FormControlLabel control={
            <Switch
                checked={authorized}
                onChange={handleAuthorizePlayers}
                disabled={isAuthorizing}
                inputProps={{ 'aria-label': 'controlled' }}
            />
        } label={AUTHORIZE_PLAYERS_SWITCH_LABEL[lang]} />
    )
}

const AUTHORIZE_PLAYERS_SWITCH_LABEL = {
    'en': 'Authorize players',
    'fr-FR': 'Autoriser les joueurs'
}