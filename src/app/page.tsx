'use client';

import { useSession } from 'next-auth/react';

import EndedGames from '@/frontend/components/home/EndedGames';
import GamesUnderConstruction from '@/frontend/components/home/GamesUnderConstruction';
import NavigationBar from '@/frontend/components/home/NavigationBar';
import OngoingGames from '@/frontend/components/home/OngoingGames';

export default function Home() {
  const { data: session } = useSession();

  // Auth is enforced by middleware; session is guaranteed here.
  const isGuest = Boolean(session?.user.isGuest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <NavigationBar />
      <UserHome isGuest={isGuest} />
    </div>
  );
}

function UserHome({ isGuest }: { isGuest: boolean }) {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="w-full max-w-7xl space-y-6 md:space-y-8 lg:space-y-10">
        <OngoingGames />
        {!isGuest && <GamesUnderConstruction />}
        {!isGuest && <EndedGames />}
      </div>
    </div>
  );
}
