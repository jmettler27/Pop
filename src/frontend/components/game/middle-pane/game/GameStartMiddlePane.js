import LoadingScreen from '@/frontend/components/LoadingScreen'
import GameErrorScreen from '@/frontend/components/game/GameErrorScreen'

import { useGameContext } from '@/frontend/contexts'
import { useGameRepositoriesContext } from '@/frontend/contexts'

import { Stack, Avatar } from '@mui/material'


export default function GameStartMiddlePane({ }) {
    const game = useGameContext()

    const { organizerRepo } = useGameRepositoriesContext()
    const { organizers, loading: organizersLoading, error: organizersError } = organizerRepo.useAllOrganizerIdentitiesOnce()

    if (organizersLoading) return <LoadingScreen />
    if (organizersError) return <GameErrorScreen />

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <div className='flex flex-col h-1/6 items-center justify-center overflow-auto'>
                <h1 className='2xl:text-6xl font-bold text-yellow-300 italic px-2'>{game.title}</h1>
            </div>
            <div className='flex flex-col h-5/6 w-full items-center justify-center space-y-4 overflow-auto'>
                <span className='2xl:text-3xl'>Ce programme à but humoristique et <strong>interactif</strong> vous est présenté par</span>

                <Stack direction='row' spacing={3} className='h-1/3' >
                    {organizers.map((o) => <OrganizerItem key={o.id} organizer={o} />)}
                </Stack>
            </div>
        </div>
    )
}

function OrganizerItem({ organizer }) {
    return (
        <div className='flex flex-col items-center justify-center space-y-2'>
            <span className='2xl:text-3xl font-bold'>{organizer.name}</span>
            <Avatar
                alt={organizer.name}
                src={organizer.image}
                sx={{ width: 'auto', height: '50%' }}
            />
        </div>
    )
}