'use client'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react';

import React from 'react';

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { collection, doc } from 'firebase/firestore';
import { useCollectionOnce, useDocumentData } from 'react-firebase-hooks/firestore'


import { localeToEmoji } from '@/lib/utils/locales';
import { GAME_MAX_NUMBER_OF_ROUNDS, GAME_TYPE_TO_EMOJI } from '@/lib/utils/game'

import LoadingScreen from '@/app/components/LoadingScreen';

import GameErrorScreen from '@/app/(game)/[id]/components/GameErrorScreen';

import { AddNewRoundButton } from '@/app/edit/[id]/components/AddNewRound'
import { EditGameRoundCard } from '@/app/edit/[id]/components/EditRoundInGame';
import { LaunchGameButton } from '@/app/edit/[id]/components/LaunchGameButton';


export default function Page({ params }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const gameId = params.id
    const user = session.user

    const [gameData, gameLoading, gameError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId))
    const [organizers, organizersLoading, organizersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'organizers'))

    if (gameError || organizersError) {
        return <GameErrorScreen />
    }
    if (gameLoading || organizersLoading) {
        return <div className='flex h-screen'><LoadingScreen loadingText='Loading...' /></div>
    }
    if (!gameData || !organizers) {
        return <></>
    }

    const organizerIds = organizers.docs.map(doc => doc.id)

    if (!organizerIds.includes(user.id))
        redirect('/')

    const game = { id: gameId, ...gameData }

    return (
        <div className='h-screen flex flex-row divide-x divide-solid'>

            {/* Left bar */}
            <div className='flex flex-col h-full w-1/6 bg-gray-100/40 lg:block dark:bg-gray-800/40 gap-2'>
                <div className='flex h-16 items-center border-b'>
                    {/* <Link className='flex items-center gap-2 font-semibold' href='#'> */}
                    {/* <Package2Icon className='h-6 w-6' /> */}
                    <span className='text-lg md:text-xl'>{GAME_TYPE_TO_EMOJI[game.type]} {localeToEmoji(game.lang)} <strong>{game.title}</strong></span>
                    {/* </Link> */}
                    {/* <Button className='ml-auto h-8 w-8' size='icon' variant='outline'>
                            <BellIcon className='h-6 w-6' />
                            <span className='sr-only'>Toggle notifications</span>
                        </Button> */}
                </div>

                {/* Left bar */}
                <div className='flex-1 overflow-auto py-2'>
                    <nav className='grid items-start px-4 text-sm font-medium'>
                        <Link
                            href='/'
                            className='flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                            prefetch={false}
                        >
                            <HomeIcon className='h-6 w-6' />
                            Home
                        </Link>
                        {/* <Link
                            className='flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50'
                            href='#'>
                            <ShoppingCartIcon className='h-6 w-6' />
                            Orders
                            <Badge
                                className='ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>6</Badge>
                        </Link>
                        <Link
                            className='flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                            href='#'>
                            <PackageIcon className='h-6 w-6' />
                            Products
                        </Link>
                        <Link
                            className='flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                            href='#'>
                            <UsersIcon className='h-6 w-6' />
                            Customers
                        </Link> */}
                        <Link
                            href={'/edit/' + gameId + '/analytics'}
                            className='flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                        >
                            <LineChartIcon className='h-6 w-6' />
                            Analytics
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className='flex flex-col h-full w-5/6'>
                {/* Search bar + user menu */}
                <header
                    className='flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40'>
                    <Link className='lg:hidden' href='#'>
                        <Package2Icon className='h-6 w-6' />
                        <span className='sr-only'>Home</span>
                    </Link>

                    {/* Search bar */}
                    {/* <div className='w-full flex-1'>
                        <form>
                            <div className='relative'>
                                <SearchIcon
                                    className='absolute left-2.5 top-2.5 h-6 w-6 text-gray-500 dark:text-gray-400' />
                                <Input
                                    className='w-full bg-white shadow-none appearance-none pl-8 md:w-2/3 lg:w-1/3 dark:bg-gray-950'
                                    placeholder="Search products..."
                                    type='search' />
                            </div>
                        </form>
                    </div> */}

                    {/* User menu */}
                    {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className='rounded-full border border-gray-200 w-8 h-8 dark:border-gray-800'
                                size='icon'
                                variant='ghost'>
                                <img
                                    alt='Avatar'
                                    className='rounded-full'
                                    height='32'
                                    src='/placeholder.svg'
                                    style={{
                                        aspectRatio: '32/32',
                                        objectFit: 'cover',
                                    }}
                                    width='32' />
                                <span className='sr-only'>Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu> */}
                </header>

                {/* Main content */}
                <EditGameRounds game={game} />
            </div>
        </div>
    );

}

function EditGameRounds({ game }) {
    console.log("RENDERING EditGameRounds")

    const { rounds: roundIds, status } = game

    return (
        <>
            <main className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6'>
                {roundIds.map(roundId => <EditGameRoundCard key={roundId} roundId={roundId} status={status} />)}
                {status === 'build' && <AddNewRoundButton disabled={roundIds.length >= GAME_MAX_NUMBER_OF_ROUNDS} />}
                {status === 'build' && <LaunchGameButton />}
            </main>
        </>
    )
}

function Package2Icon(props) {
    return (
        (<svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'>
            <path d='M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z' />
            <path d='m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9' />
            <path d='M12 3v6' />
        </svg>)
    );
}


function BellIcon(props) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'>
            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
        </svg>
    );
}


function HomeIcon(props) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'>
            <path d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
            <polyline points='9 22 9 12 15 12 15 22' />
        </svg>
    );
}


function UsersIcon(props) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'>
            <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
            <circle cx='9' cy='7' r='4' />
            <path d='M22 21v-2a4 4 0 0 0-3-3.87' />
            <path d='M16 3.13a4 4 0 0 1 0 7.75' />
        </svg>
    );
}


function LineChartIcon(props) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'>
            <path d='M3 3v18h18' />
            <path d='m19 9-5 5-4-4-3 3' />
        </svg>
    );
}
