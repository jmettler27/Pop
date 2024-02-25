'use client'

import { redirect, useParams } from 'next/navigation'

import { useSession } from "next-auth/react"

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc } from 'firebase/firestore'
import { useCollectionOnce, useDocument, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { UserContext } from '@/app/contexts'
import { GameContext, RoleContext, TeamContext } from '@/app/(game)/contexts'

import LoadingScreen from '@/app/components/LoadingScreen'

import GameErrorScreen from '@/app/(game)/[id]/components/GameErrorScreen'
import TopPane from '@/app/(game)/[id]/components/top-pane/TopPane'
import MiddlePane from '@/app/(game)/[id]/components/middle-pane/MiddlePane'
import BottomPane from '@/app/(game)/[id]/components/bottom-pane/BottomPane'
import Sidebar from '@/app/(game)/[id]/components/sidebar/Sidebar'


export default function Page({ params }) {
    const { data: session } = useSession()

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }
    const user = session.user
    // const router = useRouter()

    const gameId = params.id
    const [game, gameLoading, gameError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId))
    const [organizers, organizersLoading, organizersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'organizers'))
    const [players, playersLoading, playersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'players'))

    if (gameError || organizersError || playersError) {
        return <GameErrorScreen />
    }
    if (gameLoading || organizersLoading || playersLoading) {
        return <div className='flex h-screen'><LoadingScreen loadingText='Loading...' /></div>
    }
    if (!game || !organizers || !players) {
        return <></>
    }

    if (game.status === 'build') {
        redirect('/')
    }

    const organizerIds = organizers.docs.map(doc => doc.id)
    const playerIds = players.docs.map(doc => doc.id)

    let myRole = null
    let myTeam = null
    if (organizerIds.includes(user.id)) {
        myRole = 'organizer'
    } else if (playerIds.includes(user.id)) {
        myRole = 'player'
        myTeam = players.docs.find(doc => doc.id === user.id).data().teamId
    } else {
        if (playerIds.length < game.maxPlayers) {
            redirect(`/join/${gameId}`)
        } else {
            myRole = 'spectator'
        }
    }

    console.log("My role:", myRole)
    console.log("My team:", myTeam)
    console.log("GAME PAGE RENDERED")

    return (
        <UserContext.Provider value={user}>
            <RoleContext.Provider value={myRole}>
                <TeamContext.Provider value={myTeam}>
                    <div className='h-screen flex flex-row divide-x divide-dashed bg-slate-900'>
                        {/* Main */}
                        <div className='h-full w-5/6 flex flex-col divide-y divide-solid'>
                            <div className='h-1/6 overflow-auto'>
                                <TopPane />
                            </div>
                            <MainPane />
                        </div>
                        {/* Sidebar */}
                        <div className='h-full w-1/6 flex flex-col'>
                            <Sidebar />
                        </div>
                    </div>
                </TeamContext.Provider>
            </RoleContext.Provider>
        </UserContext.Provider>
    )
}


function MainPane({ }) {
    console.log("MAIN PANE RENDERED")

    const { id: gameId } = useParams()

    const [gameDoc, gameLoading, gameError] = useDocument(doc(GAMES_COLLECTION_REF, gameId))
    if (gameError) {
        return <GameErrorScreen />
    }
    if (gameLoading) {
        return (
            <div className='h-screen flex'>
                <LoadingScreen loadingText='Loading game...' />
            </div>
        )
    }
    if (!gameDoc) {
        return <></>
    }
    const game = { id: gameDoc.id, ...gameDoc.data() }

    return (
        <GameContext.Provider value={game}>
            <div className='h-[70%] overflow-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-800 to-slate-900'>
                <MiddlePane />
            </div>
            <div className='h-[13.33%] overflow-auto'>
                <BottomPane />
            </div>
        </GameContext.Provider>
    )
}