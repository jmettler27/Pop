import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository'
import PlayerRepository from '@/backend/repositories/user/PlayerRepository'

import { Avatar, AvatarGroup, Tooltip } from '@mui/material'
import { Skeleton } from '@mui/material'


export function GameOrganizersAvatarGroup({ gameId }) {

    const organizerRepo = new OrganizerRepository(gameId)
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
    
    const playerRepo = new PlayerRepository(gameId)
    const { players, loading, error } = playerRepo.useAllPlayersOnce()

    if (error) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
    }
    if (loading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }
    if (!players) {
        return <></>
    }

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