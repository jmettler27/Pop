import { handleRoundSelected } from '@/backend/services/round/round-transitions'

import { UserRole } from '@/backend/models/users/User'

import { timestampToHour } from '@/backend/utils/time'
import { RoundTypeIcon } from '@/backend/utils/rounds'


import { useUserContext, useRoleContext, useTeamContext, useGameRepositoriesContext } from '@/frontend/contexts'

import LoadingScreen from '@/frontend/components/LoadingScreen'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'
import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { useParams } from 'next/navigation'

import { List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material'
import NewReleasesIcon from '@mui/icons-material/NewReleases';


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
    const params = useParams()
    const gameId = params.id

    const myRole = useRoleContext()
    const myTeam = useTeamContext()
    const user = useUserContext()

    const [handleSelect, isHandling] = useAsyncAction(async (roundId) => {
        await handleRoundSelected(gameId, roundId, user.id)
    })

    const { roundRepo, chooserRepo } = useGameRepositoriesContext()
    const { rounds, loading: roundsLoading, error: roundsError } = roundRepo.useAllRounds()
    const { isChooser, loading: isChooserLoading, error: isChooserError } = chooserRepo.useIsTeamChooser(myTeam)

    if (roundsError || isChooserError) {
        console.error('GameHomeRounds.error', roundsError || isChooserError)
        return <p><strong>Error: {JSON.stringify(roundsError || isChooserError)}</strong></p>
    }
    if (roundsLoading || isChooserLoading) {
        return <LoadingScreen loadingText='Loading...' />
    }
    if (!rounds || isChooser === null) {
        console.log('GameHomeRounds.noRoundsOrChooser', rounds, isChooser)
        return <></>
    }

    console.log('GameHomeRounds.rounds', rounds)
        
    const endedRounds = rounds.filter(r => r.dateEnd !== null).map(r => r.id)
    const nonSpecialRounds = rounds.filter(r => r.type !== 'special')
    const activeNonSpecialRounds = nonSpecialRounds.filter(r => r.order === null).sort((a, b) => {
        if (a.title < b.title) return -1
        if (a.title > b.title) return 1
        return 0
    })
    const endedNonSpecialRounds = nonSpecialRounds.filter(r => r.order !== null).sort((a, b) => a.order - b.order)
    const specialRound = rounds.find(r => r.type === 'special')

    console.log('GameHomeRounds.rounds', rounds)
    console.log('GameHomeRounds.endedRounds', endedRounds)
    console.log('GameHomeRounds.nonSpecialRounds', nonSpecialRounds)
    console.log('GameHomeRounds.activeNonSpecialRounds', activeNonSpecialRounds)
    console.log('GameHomeRounds.endedNonSpecialRounds', endedNonSpecialRounds)

    const roundIsDisabled = (roundId) => {
        if (endedRounds.includes(roundId))
            return true
        if (myRole === UserRole.ORGANIZER)
            return false
        if (myRole === UserRole.PLAYER)
            return !isChooser
        return true
    }

    const showSpecial = specialRound && (myRole === UserRole.ORGANIZER || (endedRounds.length === nonSpecialRounds.length && !endedRounds.includes(specialRound.id)))

    /* Rounds */
    return (
        <>
            {activeNonSpecialRounds.length > 0 && (

                <List
                    className='rounded-lg w-1/3'
                    sx={{ bgcolor: 'background.paper' }}
                >
                    {activeNonSpecialRounds.map((round, idx) => (
                        <div key={round.id}>
                            <GameHomeRoundItem
                                round={round}
                                isDisabled={isHandling || roundIsDisabled(round.id)}
                                onSelectRound={() => handleSelect(round.id)}
                            />
                            {(idx < activeNonSpecialRounds.length - 1) && <Divider variant='inset' component='li' />}
                        </div>
                    ))}
                </List>
            )}

            {endedNonSpecialRounds.length > 0 && (
                <List
                    className='rounded-lg w-1/3'
                    sx={{ bgcolor: 'background.paper' }}
                >
                    {endedNonSpecialRounds.map((round, idx) => (
                        <div key={round.id}>
                            <GameHomeRoundItem
                                round={round}
                                isDisabled={isHandling || roundIsDisabled(round.id)}
                                onSelectRound={() => handleSelect(round.id)}
                            />
                            {(idx < endedNonSpecialRounds.length - 1) && <Divider variant='inset' component='li' />}
                        </div>
                    ))}
                </List>
            )}

            <List
                className='rounded-full w-1/8'
                sx={{ bgcolor: 'background.paper' }}
            >
                {showSpecial && (
                    <GameHomeRoundItem key={specialRound.id}
                        round={specialRound}
                        isDisabled={isHandling || myRole !== UserRole.ORGANIZER}
                        onSelectRound={() => handleSelect(specialRound.id)}
                    />
                )}
            </List>
        </>
    )
}


function GameHomeRoundItem({ round, isDisabled, onSelectRound, locale = DEFAULT_LOCALE }) {

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

            {(round.type === RoundType.LABELLING) && <NewReleasesIcon color='warning' fontSize='large' />}
        </ListItemButton>
    )
}
