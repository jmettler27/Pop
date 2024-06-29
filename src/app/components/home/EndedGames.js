import React from 'react';

import { useSession } from 'next-auth/react';

import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"
import { collection, query, where } from "firebase/firestore"
import { useCollectionOnce } from "react-firebase-hooks/firestore"

import { gameTypeToEmoji } from '@/lib/utils/game';
import { timestampToDate } from '@/lib/utils/time';
import { DEFAULT_LOCALE, localeToEmoji } from '@/lib/utils/locales';


import { Divider, Skeleton, Tooltip } from '@mui/material';
import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'
import LoadingScreen from '@/app/components/LoadingScreen';
import { GameOrganizersCardContent, GamePlayersCardContent } from '@/app/components/home/GameCardContent';

export default function EndedGames({ lang = DEFAULT_LOCALE }) {
    const [endedGamesCollection, loading, error] = useCollectionOnce(query(GAMES_COLLECTION_REF, where('status', '==', 'game_end')))
    if (error) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
    }
    if (loading) {
        return <LoadingScreen loadingText="Loading ended games..." />
    }
    if (!endedGamesCollection) {
        // Button to create a new round
        return <div>There are no games under construction yet.</div>
    }

    const sortedGames = endedGamesCollection.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.dateEnd - a.dateEnd)

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='2xl:text-2xl'>🔚 {ENDED_GAMES_CARD_TITLE[lang]} ({sortedGames.length})</CardTitle>
                {/* <RemoveRoundFromGameButton roundId={roundId} /> */}
            </CardHeader>

            <CardContent>
                <div className='grid gap-4 md:grid-cols-4'>
                    {sortedGames.map(game => <EndedGameCard key={game.id} game={game} />)}
                </div>
            </CardContent>
        </Card>
    )
}

const ENDED_GAMES_CARD_TITLE = {
    'en': 'Ended games',
    'fr-FR': 'Parties terminées',
}

export function EndedGameCard({ game, lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()
    const user = session.user

    const organizersCollectionRef = collection(GAMES_COLLECTION_REF, game.id, 'organizers')
    const [organizersCollection, organizersLoading, organizersError] = useCollectionOnce(organizersCollectionRef)

    if (organizersError) {
        return <p><strong>Error: {JSON.stringify(organizersError)}</strong></p>
    }
    if (organizersLoading) {
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
                {isOrganizer && <AccessGameDashboardButton gameId={game.id} />}
            </CardHeader>

            <CardContent>
                <GameOrganizersCardContent gameId={game.id} lang={lang} />

                <GamePlayersCardContent gameId={game.id} lang={lang} />

                <Divider className='my-2 bg-slate-600' />

                <p className='italic text-sm'>{timestampToDate(game.dateEnd, lang)}</p>
            </CardContent>
        </Card>
    )
}


import { IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';

function AccessGameDashboardButton({ gameId, lang = DEFAULT_LOCALE }) {
    return (
        <Tooltip title={ACCESS_GAME_DASHBOARD_BUTTON_LABEL[lang]} placement='top'>
            <span>
                <IconButton
                    color='primary'
                    href={'/edit/' + gameId}
                >
                    <DashboardIcon />
                </IconButton>
            </span>
        </Tooltip>
    )
}

const ACCESS_GAME_DASHBOARD_BUTTON_LABEL = {
    'en': "Access game dashboard",
    'fr-FR': "Accéder au tableau de bord",
}