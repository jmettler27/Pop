'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

// import EndedGames from '@/components/home/EndedGames';
import GamesUnderConstruction from '@/components/home/GamesUnderConstruction';
import NavigationBar from '@/components/home/NavigationBar';
import OngoingGames from '@/components/home/OngoingGames';
import { DEFAULT_BACKGROUND } from '@/helpers/background';

export default function Home() {
  const { data: session } = useSession();

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  const isGuest = Boolean(session?.user.isGuest);

  return (
    <div className="min-h-screen" style={{ backgroundImage: DEFAULT_BACKGROUND }}>
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
        {/* {!isGuest && <EndedGames />} */}
      </div>
    </div>
  );
}
