'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';

import OngoingGames from '@/frontend/components/home/OngoingGames';
import GamesUnderConstruction from '@/frontend/components/home/GamesUnderConstruction';
import EndedGames from '@/frontend/components/home/EndedGames';
import HomeBar from '@/frontend/components/home/HomeBar';

export default function Home() {
  const { data: session } = useSession();

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  console.log('My id:', user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <HomeBar />
      <UserHome user={user} />
    </div>
  );
}

function UserHome({ user }) {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="w-full max-w-7xl space-y-6 md:space-y-8 lg:space-y-10">
        {/* Active games */}
        <OngoingGames />

        {/* Games under construction */}
        <GamesUnderConstruction />

        {/* Ended games */}
        <EndedGames />
      </div>
    </div>
  );
}
