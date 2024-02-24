import React from 'react';

import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"
import { collection, query, where } from "firebase/firestore"
import { useCollection, useCollectionOnce } from "react-firebase-hooks/firestore"

export function GamesUnderConstruction({ lang = 'en' }) {
    const [gamesUnderConstructionCollection, loading, error] = useCollection(query(GAMES_COLLECTION_REF, where('status', '==', 'build')))
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

    const gamesUnderConstruction = gamesUnderConstructionCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))


    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='text-2xl'>🛠️ {GAMES_UNDER_CONSTRUCTION_CARD_TITLE[lang]} ({gamesUnderConstruction.length})</CardTitle>
                {/* <RemoveRoundFromGameButton roundId={roundId} /> */}
            </CardHeader>

            <CardContent>
                <div className='grid gap-4 md:grid-cols-4'>
                    {gamesUnderConstruction.map(game => (
                        <GameUnderConstructionCard key={game.id} game={game} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

const GAMES_UNDER_CONSTRUCTION_CARD_TITLE = {
    'en': 'Games under construction',
    'fr-FR': 'Parties en travaux',
}



import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'
import { gameTypeToEmoji } from '@/lib/utils/game';
import { localeToEmoji } from '@/lib/utils/locales';
import { useSession } from 'next-auth/react';
import { IconButton, Skeleton } from '@mui/material';

export function GameUnderConstructionCard({ game, lang = 'en' }) {
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

            </CardContent>
        </Card>
    )
}

import EditIcon from '@mui/icons-material/Edit';
import LoadingScreen from '../LoadingScreen';

function EditGameButton({ gameId }) {
    return (
        <IconButton
            color='warning'
            href={'/edit/' + gameId}
        >
            <EditIcon />
        </IconButton>
    )
}