import React from 'react';

import { useSession } from 'next-auth/react';

import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"
import { collection, query, where } from "firebase/firestore"
import { useCollection, useCollectionOnce } from "react-firebase-hooks/firestore"

import { gameTypeToEmoji } from '@/lib/utils/game';
import { localeToEmoji } from '@/lib/utils/locales';
import { timestampToDate } from '@/lib/utils/time';


import { Box, Divider, IconButton, Skeleton, Typography } from '@mui/material';
import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'
import EditGameButton from './EditGameButton';
import LoadingScreen from '../LoadingScreen';
import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from './GameAvatars';

export default function EndedGames({ lang = 'en' }) {
    const [endedGamesCollection, loading, error] = useCollection(query(GAMES_COLLECTION_REF, where('dateEnd', '!=', null)))
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
                <CardTitle className='text-2xl'>🔚 {ENDED_GAMES_CARD_TITLE[lang]} ({sortedGames.length})</CardTitle>
                {/* <RemoveRoundFromGameButton roundId={roundId} /> */}
            </CardHeader>

            <CardContent>
                <div className='grid gap-4 md:grid-cols-4'>
                    {sortedGames.map(game => (
                        <EndedGameCard key={game.id} game={game} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

const ENDED_GAMES_CARD_TITLE = {
    'en': 'Ended games',
    'fr-FR': 'Parties terminées',
}

export function EndedGameCard({ game, lang = 'en' }) {
    const { data: session } = useSession()
    const user = session.user


    const [usersCollection, usersLoading, usersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, game.id, 'users'))

    const organizersCollectionRef = collection(GAMES_COLLECTION_REF, game.id, 'organizers')
    const [organizersCollection, organizersLoading, organizersError] = useCollectionOnce(organizersCollectionRef)

    if (usersError) {
        return <p><strong>Error: {JSON.stringify(usersError)}</strong></p>
    }
    if (organizersError) {
        return <p><strong>Error: {JSON.stringify(organizersError)}</strong></p>
    }

    if (usersLoading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }
    if (organizersLoading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }


    if (!usersCollection || !organizersCollection) {
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
                <Box className='flex flex-row items-center justify-between pb-2'>
                    <Typography variant="subtitle1">Organizers</Typography>
                    <GameOrganizersAvatarGroup gameId={game.id} />
                </Box>

                {/* Players */}
                <Box className='flex flex-row items-center justify-between pb-2'>
                    <Typography variant="subtitle1">Players</Typography>
                    <GamePlayersAvatarGroup gameId={game.id} max={4} />
                </Box>

                <Divider className='my-2 bg-slate-600' />

                <p className='italic text-sm'>{timestampToDate(game.dateEnd, lang)}</p>
            </CardContent>
        </Card>
    )
}