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
    <div className="h-full flex flex-row">
      {/* Left bar */}
      <div className="flex flex-col h-full w-64 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800">
        <div className="flex h-20 items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          {/* <Link className='flex items-center gap-2 font-semibold' href='#'> */}
          {/* <Package2Icon className='h-6 w-6' /> */}
          <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {gameTypeToEmoji(game.type)} {localeToEmoji(game.lang)} {game.title}
          </span>
          {/* </Link> */}
          {/* <Button className='ml-auto h-8 w-8' size='icon' variant='outline'>
                            <BellIcon className='h-6 w-6' />
                            <span className='sr-only'>Toggle notifications</span>
                        </Button> */}
        </div>

        {/* Left bar */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-3 text-sm font-medium gap-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 group"
              prefetch={false}
            >
              <HomeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 group"
            >
              <LineChartIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Analytics
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col h-full flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Search bar + user menu */}
        <header className="flex h-20 items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-8 shadow-sm">
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
  const [allCollapsed, setAllCollapsed] = React.useState(false);

  const toggleAllCollapse = () => {
    setAllCollapsed(!allCollapsed);
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 p-8 overflow-auto">
        {/* Collapse All Button */}
        <div className="flex justify-end">
          <button
            onClick={toggleAllCollapse}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-medium"
          >
            {allCollapsed ? (
              <>
                <ChevronDownIcon className="h-5 w-5" />
                Expand All
              </>
            ) : (
              <>
                <ChevronUpIcon className="h-5 w-5" />
                Collapse All
              </>
            )}
          </button>
        </div>
        <div className="space-y-6">
          {roundIds.map((roundId) => (
            <EditGameRoundCard
              key={roundId}
              roundId={roundId}
              status={status}
              gameId={game.id}
              forceCollapse={allCollapsed}
            />
          ))}
        </div>
        {status === GameStatus.GAME_EDIT && (
          <div className="fixed bottom-0 left-64 right-0 flex justify-center items-center gap-4 bg-gradient-to-t from-slate-50/60 to-slate-50/40 dark:from-slate-950/60 dark:to-slate-950/40 border-t border-slate-200 dark:border-slate-800 backdrop-blur-sm p-4 shadow-lg">
            <AddNewRoundButton disabled={roundIds.length >= Game.MAX_NUM_ROUNDS} />
            <LaunchGameButton />
          </div>
        )}
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

function ChevronDownIcon(props) {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon(props) {
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
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
