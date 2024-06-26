import React from 'react';

import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"
import { and, collection, query, where } from "firebase/firestore"
import { useCollectionOnce } from "react-firebase-hooks/firestore"

import { gameTypeToEmoji } from '@/lib/utils/game';
import { DEFAULT_LOCALE, localeToEmoji } from '@/lib/utils/locales';

import { useSession } from 'next-auth/react';

import { Skeleton, Tooltip } from '@mui/material';
import LoadingScreen from '@/app/components/LoadingScreen';
import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'


export default function GamesUnderConstruction({ lang = DEFAULT_LOCALE }) {
    const [gamesUnderConstructionCollection, loading, error] = useCollectionOnce(query(GAMES_COLLECTION_REF, where('status', '==', 'build')))
    if (error) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
    }
    if (loading) {
        return <LoadingScreen loadingText="Loading games under construction..." />
    }
    if (!gamesUnderConstructionCollection) {
        // Button to create a new round
        return <div>There are no games under construction yet.</div>
    }

    const sortedGames = gamesUnderConstructionCollection.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.dateEnd - a.dateEnd)

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='2xl:text-2xl'>🛠️ {GAMES_UNDER_CONSTRUCTION_CARD_TITLE[lang]} ({sortedGames.length})</CardTitle>
            </CardHeader>

            <CardContent>
                <div className='grid gap-4 md:grid-cols-4'>
                    {sortedGames.map(game => <GameUnderConstructionCard key={game.id} game={game} />)}
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

    const organizersCollectionRef = collection(GAMES_COLLECTION_REF, game.id, 'organizers')
    const [organizersCollection, loading, error] = useCollectionOnce(organizersCollectionRef)
    if (error) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
    }
    if (loading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }
    if (!organizersCollection) {
        return <></>
    }
    const organizers = organizersCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const isOrganizer = organizers.some(organizer => organizer.id === user.id)

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

import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { GameOrganizersCardContent } from './GameCardContent';

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