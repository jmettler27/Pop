'use client';

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import { gameTypeToEmoji } from '@/backend/models/games/GameType';
import GameRepository from '@/backend/repositories/game/GameRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { localeToEmoji } from '@/frontend/helpers/locales';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';

const messages = defineMessages('frontend.gameEditor.EditGamePage', {
  analytics: 'Analytics',
  participants: 'Participants',
});

export default function EditGameLayout({ children, params }) {
  const { data: session } = useSession();
  const intl = useIntl();
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  const gameRepo = new GameRepository(gameId);
  const organizerRepo = new OrganizerRepository(gameId);

  const { game, loading: gameLoading, error: gameError } = gameRepo.useGame(gameId);
  const { organizers, loading: organizersLoading, error: organizersError } = organizerRepo.useAllOrganizersOnce();

  if (gameError || organizersError) return <ErrorScreen />;
  if (gameLoading || organizersLoading) return <LoadingScreen />;
  if (!game || !organizers) return <></>;

  const organizerIds = organizers.map((o) => o.id);
  if (!organizerIds.includes(user.id)) redirect('/');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top bar with title */}
      <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 shrink-0">
        <span className="text-xl">
          {gameTypeToEmoji(game.type)} {localeToEmoji(game.lang)}
        </span>
        <span className="text-xl font-bold text-slate-100">{game.title}</span>
      </header>

      <div className="flex flex-row flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="flex flex-col w-56 bg-slate-950 border-r border-slate-800 overflow-y-auto shrink-0">
          <nav className="flex flex-col gap-1 p-3">
            <Link
              href={'/edit/' + gameId}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-blue-400 group"
              prefetch={false}
            >
              <HomeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {intl.formatMessage(globalMessages.home)}
            </Link>
            <Link
              href={'/edit/' + gameId + '/participants'}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-blue-400 group"
            >
              <UsersIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {intl.formatMessage(messages.participants)}
            </Link>
            {/* <Link
              href={'/edit/' + gameId + '/analytics'}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-blue-400 group"
            >
              <LineChartIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {intl.formatMessage(messages.analytics)}
            </Link> */}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-h-0 bg-slate-950">{children}</div>
      </div>
    </div>
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
