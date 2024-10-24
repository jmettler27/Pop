import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection } from 'firebase/firestore'
import { useCollectionOnce } from 'react-firebase-hooks/firestore'

import { Stack, Avatar } from '@mui/material'
import LoadingScreen from '@/app/components/LoadingScreen'
import GameErrorScreen from '@/app/(game)/[id]/components/GameErrorScreen'

export default function GameStartMiddlePane({ }) {
    const game = useGameContext()

    const [organizersCollection, organizersLoading, organizersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, game.id, 'organizers'))
    if (organizersLoading) {
        return <LoadingScreen />
    }
    if (organizersError) {
        return <GameErrorScreen />
    }
    if (!organizersCollection) {
        return <GameErrorScreen />
    }

    const organizers = organizersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <div className='flex flex-col h-1/6 items-center justify-center overflow-auto'>
                <h1 className='2xl:text-6xl font-bold text-yellow-300 italic px-2'>{game.title}</h1>
            </div>
            <div className='flex flex-col h-5/6 w-full items-center justify-center space-y-4 overflow-auto'>
                <span className='2xl:text-3xl'>Ce programme à but humoristique et <strong>interactif</strong> vous est présenté par</span>

                <Stack direction='row' spacing={3} className='h-1/3' >
                    {organizers.map((organizer) => <OrganizerItem key={organizer.id} organizer={organizer} />)}
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