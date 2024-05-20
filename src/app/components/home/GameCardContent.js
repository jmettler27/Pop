import { Box, Typography } from '@mui/material'


import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from './GameAvatars'

export function GameOrganizersCardContent({ gameId, lang = 'fr-FR' }) {
    return (
        <Box className='flex flex-row items-center justify-between pb-2'>
            <Typography variant="subtitle1">{ORGANIZERS[lang]}</Typography>
            <GameOrganizersAvatarGroup gameId={gameId} />
        </Box>
    )
}

export function GamePlayersCardContent({ gameId, lang = 'fr-FR' }) {
    return (
        <Box className='flex flex-row items-center justify-between pb-2'>
            <Typography variant="subtitle1">{PLAYERS[lang]}</Typography>
            <GamePlayersAvatarGroup gameId={gameId} max={4} />
        </Box>
    )
}

const ORGANIZERS = {
    'en': 'Organizers',
    'fr-FR': 'Organisateurs',
}

const PLAYERS = {
    'en': 'Players',
    'fr-FR': 'Joueurs',
}