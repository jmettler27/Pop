import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, query, where } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'

import { Stack, Avatar } from '@mui/material'
import clsx from 'clsx'

import TeamScore from './TeamScore'
import { useParams } from 'next/navigation'

export default function TopPane({ }) {
    const { id: gameId } = useParams()

    const [teamsCollection, teamsLoading, teamsError] = useCollection(collection(GAMES_COLLECTION_REF, gameId, 'teams'))
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (teamsLoading) {
        return <p>Loading teams...</p>
    }
    if (!teamsCollection) {
        return <></>
    }

    console.log("TOP PANE RENDERED")

    const teams = teamsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return (
        <div className='flex flex-row h-full justify-center space-x-9 items-center'>
            {teams.map((team) => <TeamItem key={team.id} team={team} />)}
        </div>
    )
}


function TeamItem({ team }) {
    return (
        <div className='flex flex-col h-[90%] items-center justify-around'>
            {/* Team name */}
            <div className='flex flex-col h-[5%] items-center justify-center'>
                {team.teamAllowed && <TeamName team={team} />}
            </div>

            {/* Team players */}
            <div className='flex h-2/3 items-center p-2 rounded-lg' style={{ border: '2px solid', color: team.color }} >
                <TeamPlayersInfo teamId={team.id} />
            </div>

            {/* Team score */}
            <div className='flex flex-col h-[5%] items-center justify-center'>
                <TeamScore teamId={team.id} />
            </div>
        </div>
    )
}

const TeamName = ({ team }) =>
    <span className='text-3xl' style={{ color: team.color }}><strong><i>&quot;{team.name}&quot;</i></strong></span>


function TeamPlayersInfo({ teamId }) {
    const { id: gameId } = useParams()

    const [playersCollection, playersLoading, playersError] = useCollection(query(collection(GAMES_COLLECTION_REF, gameId, 'players'), where('teamId', '==', teamId)))
    if (playersError) {
        return <p><strong>Error: {JSON.stringify(playersError)}</strong></p>
    }
    if (playersLoading) {
        return <p>Loading team players...</p>
    }
    if (!playersCollection) {
        return <></>
    }

    const players = playersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return (
        <Stack className='flex flex-row h-full' direction='row' spacing={3} >
            {players.map((player) => <PlayerItem key={player.id} player={player} />)}
        </Stack>
    )
}


function PlayerItem({ player }) {
    return (
        <div className='flex flex-col h-full items-center justify-between'>
            {/* Player name */}
            <div className='flex flex-col h-1/6 justify-center items-center'>
                <PlayerName player={player} />
            </div>
            {/* Player avatar */}
            <div className='flex flex-col h-[70%] justify-center items-center'>
                <PlayerAvatar player={player} />
            </div>
        </div>
    )
}

function PlayerName({ player }) {
    return (
        <span className={clsx('text-xl', playerNameGlowColor(player.status), playerNameColor(player.status))}>
            {player.name}
        </span>
    )
}

function PlayerAvatar({ player }) {
    return (
        <Avatar
            variant='square'
            alt={player.name}
            src={player.image}
            className={clsx('ring-4', playerRingColor(player.status))}
            sx={{ height: '90%', width: 'auto' }}
        />
    )
}

const playerNameGlowColor = (playerStatus) => {
    switch (playerStatus) {
        case 'focus':
            return 'glow-focus'
        case 'correct':
            return 'glow-correct'
        case 'ready':
            return 'glow-ready'
        case 'wrong':
            return 'glow-wrong'
    }
}

const playerNameColor = (playerStatus) => {
    switch (playerStatus) {
        case 'focus':
            return 'text-focus'
        case 'correct':
            return 'text-correct'
        case 'wrong':
            return 'text-wrong'
        case 'ready':
            return 'text-ready'
        case 'idle':
            return 'text-inherit'
    }
}

const playerRingColor = (playerStatus) => {
    switch (playerStatus) {
        case 'focus':
            return 'ring-focus'
        case 'correct':
            return 'ring-correct'
        case 'wrong':
            return 'ring-wrong'
        case 'ready':
            return 'ring-ready'
        case 'idle':
            return 'ring-black'
    }
}
