'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

// import EndedGames from '@/frontend/components/home/EndedGames';
import GamesUnderConstruction from '@/frontend/components/home/GamesUnderConstruction';
import NavigationBar from '@/frontend/components/home/NavigationBar';
import OngoingGames from '@/frontend/components/home/OngoingGames';
import { DEFAULT_BACKGROUND } from '@/frontend/helpers/background';

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
