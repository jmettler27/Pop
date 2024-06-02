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
import { timestampToHour } from '@/lib/utils/time'

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
    return <h1 className='2xl:text-5xl font-bold'>Les manches</h1>
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
    const activeNonFinaleRounds = nonFinaleRounds.filter(round => round.order === null).sort((a, b) => {
        if (a.title < b.title) return -1
        if (a.title > b.title) return 1
        return 0
    })

    const endedNonFinaleRounds = nonFinaleRounds.filter(round => round.order !== null).sort((a, b) => a.order - b.order)


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
            {activeNonFinaleRounds.length > 0 && (

                <List
                    className='rounded-lg w-1/3'
                    sx={{ bgcolor: 'background.paper' }}
                >
                    {activeNonFinaleRounds.map((round, idx) => (
                        <div key={round.id}>
                            <GameHomeRoundItem
                                round={round}
                                isDisabled={isHandling || roundIsDisabled(round.id)}
                                onSelectRound={() => handleSelect(round.id)}
                            />
                            {(idx < activeNonFinaleRounds.length - 1) && <Divider variant='inset' component='li' />}
                        </div>
                    ))}
                </List>
            )}

            {endedNonFinaleRounds.length > 0 && (
                <List
                    className='rounded-lg w-1/3'
                    sx={{ bgcolor: 'background.paper' }}
                >
                    {endedNonFinaleRounds.map((round, idx) => (
                        <div key={round.id}>
                            <GameHomeRoundItem
                                round={round}
                                isDisabled={isHandling || roundIsDisabled(round.id)}
                                onSelectRound={() => handleSelect(round.id)}
                            />
                            {(idx < endedNonFinaleRounds.length - 1) && <Divider variant='inset' component='li' />}
                        </div>
                    ))}
                </List>
            )}

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

import NewReleasesIcon from '@mui/icons-material/NewReleases';

function GameHomeRoundItem({ round, isDisabled, onSelectRound, locale = 'fr-FR' }) {

    const secondaryText = () => {
        if (!round.dateStart)
            return ''

        const startTime = timestampToHour(round.dateEnd, locale)

        if (!round.dateEnd) {
            const now = new Date()
            const elapsedSecs = now.getTime() / 1000 - round.dateStart.seconds
            const elapsedMins = Math.floor(elapsedSecs / 60)
            return `Commencée à ${startTime} (y a ${elapsedMins} min)`
        }

        const endTime = timestampToHour(round.dateEnd, locale)
        const durationSecs = round.dateEnd.seconds - round.dateStart.seconds
        const durationMins = Math.floor(durationSecs / 60)
        return `Manche terminée à ${endTime} (${durationMins} min)`
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
                    className: '2xl:text-2xl'
                }}
                secondary={secondaryText()}
                secondaryTypographyProps={{
                    className: 'text-lg'
                }}
            />

            {(round.type === 'matching' || round.type == 'quote') && <NewReleasesIcon color='warning' fontSize='large' />}
        </ListItemButton>
    )
}
