import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc, limit, or, orderBy, query, where } from 'firebase/firestore'
import { useCollection, useCollectionOnce, useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { styled } from '@mui/material/styles'
import { Avatar, AvatarGroup, Box, Button, Divider, Grid, Typography } from '@mui/material'
import { Skeleton } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import LoginIcon from '@mui/icons-material/Login'
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import GameErrorScreen from '@/app/(game)/[id]/components/GameErrorScreen'

import { arrayToCommaSeparatedString } from '@/lib/utils/arrays'
import { Card, CardContent, CardHeader, CardTitle } from '../card'


import { gameTypeToEmoji } from '@/lib/utils/game'
import { localeToEmoji } from '@/lib/utils/locales'

export default function OngoingGames({ lang = 'en' }) {
    const [games, gamesLoading, gamesError] = useCollection(query(GAMES_COLLECTION_REF,
        or(where('status', '==', 'game_start'),
            where('status', '==', 'game_home'),
            where('status', '==', 'round_start'),
            where('status', '==', 'question_active'),
            where('status', '==', 'question_end'),
            where('status', '==', 'round_end'),
            where('status', '==', 'finale')
        )
    ))
    if (gamesError) {
        return <p><strong>Error: {JSON.stringify(gamesError)}</strong></p>
    }
    if (gamesLoading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }
    if (!games) {
        return <></>
    }
    const sortedOngoingGames = games.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.dateStart - a.dateStart)

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='text-2xl'>🕒 {ONGOING_GAMES_CARD_TITLE[lang]} ({sortedOngoingGames.length})</CardTitle>
                {/* <RemoveRoundFromGameButton roundId={roundId} /> */}
            </CardHeader>

            <CardContent>
                <div className='grid gap-4 md:grid-cols-4'>
                    {sortedOngoingGames.map(game => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

const ONGOING_GAMES_CARD_TITLE = {
    'en': 'Ongoing games',
    'fr-FR': 'Parties en cours',
}

const GameCard = ({
    game,
}) => {
    const router = useRouter()
    const { data: session } = useSession()
    const user = session.user

    const [organizers, organizersLoading, organizersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, game.id, 'organizers'))
    const [players, playersLoading, playersError] = useCollection(collection(GAMES_COLLECTION_REF, game.id, 'players'))

    if (organizersError || playersError) {
        return <GameErrorScreen />
    }
    if (organizersLoading || playersLoading) {
        return <Skeleton variant='rounded' width={210} height={60} />
    }
    if (!organizers || !players) {
        return <GameErrorScreen /> // TODO: Change this
    }

    const organizerIds = organizers.docs.map(doc => doc.id)
    const playerIds = players.docs.map(doc => doc.id)

    const isFull = playerIds.length >= game.maxPlayers

    let myRole = null
    if (organizerIds.includes(user.id)) {
        myRole = 'organizer'
    } else if (playerIds.includes(user.id)) {
        myRole = 'player'
    } else {
        myRole = 'spectator'
    }

    const buttonText = () => {
        if (myRole === 'spectator') {
            if (isFull) {
                return 'Watch'
            }
            return 'Join'
        }
        return 'Continue'
    }

    const ButtonIcon = () => {
        if (myRole === 'spectator') {
            if (isFull) {
                return <VisibilityIcon />
            }
            return <LoginIcon />
        }
        return <PlayArrowIcon />
    }

    const buttonColor = () => {
        if (myRole === 'spectator') {
            if (isFull) {
                return 'warning'
            }
            return 'primary'
        }
        return 'success'
    }

    const handleJoinClick = () => {
        if (myRole === 'spectator' && !isFull) {
            router.push(`/join/${game.id}`)
        } else {
            router.push(`/${game.id}`)
        }
    }

    return (
        <Card className='!important border-4 border-red-400'>
            <CardHeader className='flex flex-row items-center justify-around pb-2'>
                <CardTitle className='text-lg font-medium'>{gameTypeToEmoji(game.type)} {localeToEmoji(game.lang)} <i>{game.title}</i></CardTitle>
            </CardHeader>

            <CardContent>
                {/* Organizers */}
                <GameOrganizersAvatarGroup gameId={game.id} />

                {/* Players */}
                <GamePlayersAvatarGroup gameId={game.id} max={4} />

                <Divider className='my-2 bg-slate-600' />

                {/* Join button */}
                <JoinGameButton
                    variant='outlined'
                    style={{ border: '2px solid' }}
                    color={buttonColor()}
                    endIcon={<ButtonIcon />}
                    onClick={handleJoinClick}
                >
                    {buttonText()}
                </JoinGameButton>
            </CardContent>
        </Card>

        // <GameCardRoot>
        //     <GameCardColumn container direction='column' justifyContent='space-between'>
        //         <Grid item container spacing={1}>
        //             {/* Game logo */}
        //             <GameCardLogo className='self-center' variant={'rounded'} src={game.image} />

        //             <Grid item>
        //                 {/* Game title */}
        //                 <Typography variant='subtitle1' color='textPrimary'>{game.title}</Typography>
        //                 {/* Game organizers */}
        //                 <Typography variant='caption' color='textSecondary'>{`Organizers: ${arrayToCommaSeparatedString(organizers.docs.map(doc => doc.data().name))}`}</Typography>
        //             </Grid>

        //             <Grid item>
        //                 {/* Game occupancy */}
        //                 <Typography variant='caption' color='textSecondary'>{playerIds.length}/{game.maxPlayers}</Typography>
        //             </Grid>
        //         </Grid>


        //         <Grid item container alignItems='center' justifyContent='space-between'>
        //             {/* Players */}
        //             <GamePlayersAvatarGroup gameId={game.id} max={4} />

        //             {/* Join button */}
        //             <JoinGameButton
        //                 variant='outlined'
        //                 color={buttonColor()}
        //                 endIcon={<ButtonIcon />}
        //                 onClick={handleJoinClick}
        //             >
        //                 {buttonText()}
        //             </JoinGameButton>
        //         </Grid>
        //     </GameCardColumn>
        // </GameCardRoot>
    )
}


function GameOrganizersAvatarGroup({ gameId }) {
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
                <Avatar key={organizer.id} src={organizer.image} alt={organizer.name} />
            ))}
        </AvatarGroup>
    )
}


function GamePlayersAvatarGroup({ gameId }) {
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
                <Avatar key={player.id} src={player.image} alt={player.name} />
            ))}
        </AvatarGroup>
    )
}

const JoinGameButton = styled(Button)(({ theme }) => ({
    '& > *': {
        textTransform: 'none !important',
    },
}))