import React from 'react';

import GameRepository from '@/backend/repositories/game/GameRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';

import { gameTypeToEmoji } from '@/backend/models/games/GameType';
import { DEFAULT_LOCALE, localeToEmoji } from '@/frontend/utils/locales';

import { useSession } from 'next-auth/react';


import { IconButton, Skeleton, Tooltip } from '@mui/material';

import { CardTitle, CardHeader, CardContent, Card } from '@/frontend/components/card'
import { GameOrganizersCardContent } from '@/frontend/components/home/GameCardContent';

import LoadingScreen from '@/frontend/components/LoadingScreen';

import EditIcon from '@mui/icons-material/Edit';
import { GameStatus } from '@/backend/models/games/GameStatus';


export default function GamesUnderConstruction({ lang = DEFAULT_LOCALE }) { 
    const gameRepo = new GameRepository()
    const { games, loading, error } = gameRepo.useGamesByStatus(GameStatus.GAME_EDIT)
    if (error) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
    }
    if (loading) {
        return <LoadingScreen loadingText="Loading games under construction..." />
    }
    if (!games) {
        // Button to create a new round
        return <div>There are no games under construction yet.</div>
    }

    const sortedGames = games.sort((a, b) => b.dateEnd - a.dateEnd)

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='2xl:text-2xl'>🛠️ {GAMES_UNDER_CONSTRUCTION_CARD_TITLE[lang]} ({sortedGames.length})</CardTitle>
            </CardHeader>

            <CardContent>
                <div className='grid gap-4 md:grid-cols-4'>
                    {sortedGames.map(g => <GameUnderConstructionCard key={g.id} game={g} />)}
                </div>
            </CardContent>
        </Card>
    )
}

const GAMES_UNDER_CONSTRUCTION_CARD_TITLE = {
    'en': 'Games under construction',
    'fr-FR': 'Parties en travaux',
}


export function GameUnderConstructionCard({ game, lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()
    const user = session.user

    console.log(game)

    const organizerRepo = new OrganizerRepository(game.id)
//    const { isOrganizer, loading, error } = organizerRepo.useIsOrganizer(user.id)
    const { organizers, loading, error } = organizerRepo.useAllOrganizersOnce()
    if (error) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
    }
    if (loading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }
    if (!organizers) {
        return <></>
    }

    const isOrganizer = organizers.find(o => o.id === user.id)
    if (isOrganizer == null) {
        return <></>
    }

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-around pb-2'>
                <CardTitle className='text-lg font-medium'>{gameTypeToEmoji(game.type)} {localeToEmoji(game.lang)} <i>{game.title}</i></CardTitle>
                {isOrganizer && <EditGameButton gameId={game.id} />}
            </CardHeader>
            <CardContent>
                <GameOrganizersCardContent gameId={game.id} lang={lang} />
            </CardContent>
        </Card>
    )
}



function EditGameButton({ gameId, lang = DEFAULT_LOCALE }) {
    return (
        <Tooltip title={ACCESS_GAME_EDITOR_BUTTON_LABEL[lang]} placement='top'>
            <span>
                <IconButton
                    color='warning'
                    href={'/edit/' + gameId}
                >
                    <EditIcon />
                </IconButton>
            </span>
        </Tooltip>
    )
}

const ACCESS_GAME_EDITOR_BUTTON_LABEL = {
    'en': "Edit game",
    'fr-FR': "Éditer la partie",
}