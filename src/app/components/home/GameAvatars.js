import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, query } from 'firebase/firestore'
import { useCollectionOnce } from 'react-firebase-hooks/firestore'

import { Avatar, AvatarGroup, Tooltip } from '@mui/material'
import { Skeleton } from '@mui/material'


export function GameOrganizersAvatarGroup({ gameId }) {
    const organizersRef = collection(GAMES_COLLECTION_REF, gameId, 'organizers')
    const [organizersCollection, organizersLoading, organizersError] = useCollectionOnce(query(organizersRef))

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

    return (
        <AvatarGroup max={4}>
            {organizers.map((organizer) => (
                <Tooltip key={organizer.id} title={organizer.name} placement='top'>
                    <Avatar src={organizer.image} alt={organizer.name} />
                </Tooltip>
            ))}
        </AvatarGroup>
    )
}


export function GamePlayersAvatarGroup({ gameId }) {
    const playersRef = collection(GAMES_COLLECTION_REF, gameId, 'players')
    const [playersCollection, playersLoading, playersError] = useCollectionOnce(query(playersRef))

    if (playersError) {
        return <p><strong>Error: {JSON.stringify(playersError)}</strong></p>
    }
    if (playersLoading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }
    if (!playersCollection) {
        return <></>
    }

    const players = playersCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return (
        <AvatarGroup max={4}>
            {players.map((player) => (
                <Tooltip key={player.id} title={player.name} placement='top'>
                    <Avatar src={player.image} alt={player.name} />
                </Tooltip>
            ))}
        </AvatarGroup>
    )
}