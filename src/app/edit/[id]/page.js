'use client';

import { gameTypeToEmoji } from '@/backend/models/games/GameType';
import { GameStatus } from '@/backend/models/games/GameStatus';
import Game from '@/backend/models/games/Game';

import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import GameRepository from '@/backend/repositories/game/GameRepository';

import { localeToEmoji } from '@/frontend/utils/locales';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';

import React from 'react';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import GameErrorScreen from '@/frontend/components/game/GameErrorScreen';
import { AddNewRoundButton } from '@/frontend/components/game-editor/AddNewRound';
import { EditGameRoundCard } from '@/frontend/components/game-editor/EditRoundInGame';
import { LaunchGameButton } from '@/frontend/components/game-editor/LaunchGameButton';

export default function Page({ params }) {
  const { data: session } = useSession();
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;

  console.log('Game ID: ', gameId);

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  const gameRepo = new GameRepository(gameId);
  const organizerRepo = new OrganizerRepository(gameId);

  const { game, loading: gameLoading, error: gameError } = gameRepo.useGame(gameId);
  const { organizers, loading: organizersLoading, error: organizersError } = organizerRepo.useAllOrganizersOnce();

  if (gameError || organizersError) {
    return <GameErrorScreen />;
  }
  if (gameLoading || organizersLoading) {
    return (
      <div className="flex h-screen">
        <LoadingScreen loadingText="Loading..." />
      </div>
    );
  }
  if (!game || !organizers) {
    console.log('No game or organizers found');
    return <></>;
  }

  console.log('Game: ', game);
  console.log('Organizers: ', organizers);
  const organizerIds = organizers.map((o) => o.id);

  if (!organizerIds.includes(user.id)) redirect('/');

  return (
    <div className="h-screen flex flex-row divide-x divide-solid">
      {/* Left bar */}
      <div className="flex flex-col h-full w-1/6 bg-gray-100/40 lg:block dark:bg-gray-800/40 gap-2">
        <div className="flex h-16 items-center border-b">
          {/* <Link className='flex items-center gap-2 font-semibold' href='#'> */}
          {/* <Package2Icon className='h-6 w-6' /> */}
          <span className="text-lg md:text-xl">
            {gameTypeToEmoji(game.type)} {localeToEmoji(game.lang)} <strong>{game.title}</strong>
          </span>
          {/* </Link> */}
          {/* <Button className='ml-auto h-8 w-8' size='icon' variant='outline'>
                            <BellIcon className='h-6 w-6' />
                            <span className='sr-only'>Toggle notifications</span>
                        </Button> */}
        </div>

        {/* Left bar */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              prefetch={false}
            >
              <HomeIcon className="h-6 w-6" />
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            >
              <LineChartIcon className="h-6 w-6" />
              Analytics
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col h-full w-5/6">
        {/* Search bar + user menu */}
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
          <Link className="lg:hidden" href="#">
            <Package2Icon className="h-6 w-6" />
            <span className="sr-only">Home</span>
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
  console.log('RENDERING EditGameRounds');
  console.log('Game: ', game);

  const { rounds: roundIds, status } = game;

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {roundIds.map((roundId) => (
          <EditGameRoundCard key={roundId} roundId={roundId} status={status} gameId={game.id} />
        ))}
        {status === GameStatus.GAME_EDIT && <AddNewRoundButton disabled={roundIds.length >= Game.MAX_NUM_ROUNDS} />}
        {status === GameStatus.GAME_EDIT && <LaunchGameButton />}
      </main>
    </>
  );
}

function Package2Icon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  );
}

function BellIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LineChartIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}
