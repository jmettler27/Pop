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
    <>
      <HomeBar />
      <UserHome user={user} />
    </>
  );
}

function UserHome({ user }) {
  return (
    // <div className="flex flex-col w-4/5 items-center justify-around divide-y divide-solid">

    <div className="flex flex-1 flex-col w-4/5 gap-4 p-4 md:gap-8 md:p-6 divide-y divide-solid">
      {/* Create a new game */}

      {/* Active games */}
      <OngoingGames />

      {/* Games under construction */}
      <GamesUnderConstruction />

      {/* Ended games */}
      <EndedGames />
    </div>
  );
}
