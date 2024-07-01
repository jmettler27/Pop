import { useParams } from 'next/navigation'

import { useAsyncAction } from '@/lib/utils/async'

import { CircularProgress, FormControlLabel, Switch } from '@mui/material'
import { togglePlayerAuthorization } from '@/app/(game)/lib/game'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'


export default function AuthorizePlayersSwitch({ authorized, lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()

    const [handleAuthorizePlayers, isAuthorizing] = useAsyncAction(async () => {
        await togglePlayerAuthorization(gameId)
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