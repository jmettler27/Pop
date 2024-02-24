import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext, useTeamContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc, collection } from 'firebase/firestore'
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore'

import { List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material'
import { RoundTypeIcon } from '@/lib/utils/question_types'
import LoadingScreen from '@/app/components/LoadingScreen'

import { handleSelectRound } from '@/app/(game)/lib/round/round-transitions'
import { useAsyncAction } from '@/lib/utils/async'

export default function GameHomeMiddlePane({ }) {
    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <div className='flex flex-col h-[10%] items-center justify-center'>
                <GameHomeTitle />
            </div>
            <div className='flex flex-col h-[90%] w-full items-center justify-around overflow-auto'>
                <GameHomeRounds />
            </div>
        </div>
    )
}


function GameHomeTitle() {
    return <h1 className='text-5xl font-bold'>Les manches</h1>
}

function GameHomeRounds() {
    const { id: gameId } = useParams()
    const myRole = useRoleContext()
    const myTeam = useTeamContext()
    const user = useUserContext()

    const [handleSelect, isHandling] = useAsyncAction(async (roundId) => {
        await handleSelectRound(gameId, roundId, user.id)
    })

    const [roundsCollection, roundsLoading, roundsError] = useCollection(collection(GAMES_COLLECTION_REF, gameId, 'rounds'))
    const [gameStates, gameStatesLoading, gameStatesError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states'))

    if (roundsError) {
        return <p><strong>Error: {JSON.stringify(roundsError)}</strong></p>
    }
    if (gameStatesError) {
        return <p><strong>Error: {JSON.stringify(gameStatesError)}</strong></p>
    }
    if (roundsLoading || gameStatesLoading) {
        return <LoadingScreen loadingText='Loading...' />
    }
    if (!roundsCollection || !gameStates) {
        return <></>
    }

    const rounds = roundsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    const endedRounds = rounds.filter(round => round.dateEnd !== null).map(round => round.id)

    const nonFinaleRounds = rounds.filter(round => round.type !== 'finale')
    const finaleRound = rounds.find(round => round.type === 'finale')

    const chooserTeamId = gameStates.chooserOrder[gameStates.chooserIdx]
    const isChooser = myTeam === chooserTeamId

    const roundIsDisabled = (roundId) => {
        if (endedRounds.includes(roundId))
            return true
        if (myRole === 'organizer')
            return false
        if (myRole === 'player')
            return !isChooser
        return true
    }

    const showFinale = finaleRound && (myRole === 'organizer' || (endedRounds.length === nonFinaleRounds.length && !endedRounds.includes(finaleRound.id)))

    /* Rounds */
    return (
        <>
            <List
                className='rounded-lg w-1/3'
                sx={{ bgcolor: 'background.paper' }}
            >
                {nonFinaleRounds.map((round, idx) => (
                    <div key={round.id}>
                        <GameHomeRoundItem
                            round={round}
                            isDisabled={isHandling || roundIsDisabled(round.id)}
                            onSelectRound={() => handleSelect(round.id)}
                        />
                        {(idx < nonFinaleRounds.length - 1) && <Divider variant='inset' component='li' />}
                    </div>
                ))}
            </List>

            <List
                className='rounded-full w-1/8'
                sx={{ bgcolor: 'background.paper' }}
            >
                {showFinale && (
                    <GameHomeRoundItem key={finaleRound.id}
                        round={finaleRound}
                        isDisabled={isHandling || myRole !== 'organizer'}
                        onSelectRound={() => handleSelect(finaleRound.id)}
                    />
                )}
            </List>
        </>
    )
}

function GameHomeRoundItem({ round, isDisabled, onSelectRound }) {

    const secondaryText = () => {
        if (!round.dateStart)
            return ''

        const startTimestamp = round.dateStart.toDate()
        const startDate = startTimestamp.toLocaleDateString('fr-FR')
        const startTime = startTimestamp.toLocaleTimeString('fr-FR')

        const now = new Date()
        const elapsedSecs = now.getTime() / 1000 - round.dateStart.seconds
        const elapsedMins = Math.floor(elapsedSecs / 60)

        if (!round.dateEnd) {
            return `Commencée à ${startTime} (y a ${elapsedMins} min)`
        }

        const endTimestamp = round.dateEnd.toDate()
        const endDate = endTimestamp.toLocaleDateString('fr-FR')
        const endTime = endTimestamp.toLocaleTimeString('fr-FR')

        // Calculate the time elapsed between round.dateEnd and round.dateStart and put it in the secondary text
        const durationSecs = round.dateEnd.seconds - round.dateStart.seconds
        const durationMins = Math.floor(durationSecs / 60)
        return `Finito à ${endTime} (${durationMins} min)`
    }

    return (
        <ListItemButton
            disabled={isDisabled}
            onClick={onSelectRound}
            sx={{
                '&.Mui-disabled': {
                    opacity: 1
                }
            }}
        >
            <ListItemAvatar>
                <Avatar sx={{
                    bgcolor: round.dateEnd ? 'text.disabled' : 'primary.main',
                    // opacity: isDisabled ? 0.5 : 1,
                }}>
                    <RoundTypeIcon roundType={round.type} fontSize={30} />
                </Avatar>
            </ListItemAvatar>

            <ListItemText
                sx={{
                    color: round.dateEnd ? 'text.disabled' : 'text.primary',
                    '& .MuiListItemText-primary': {
                        // fontSize: '1.5rem',
                        textDecoration: round.dateEnd ? 'line-through' : 'none',
                        textDecorationThickness: '2px',
                        // textDecorationColor: 'text.disabled',
                    },
                }}
                primary={round.title}
                primaryTypographyProps={{
                    className: 'text-2xl'
                }}
                secondary={secondaryText()}
                secondaryTypographyProps={{
                    className: 'text-lg'
                }}
            />
        </ListItemButton>
    )
}
