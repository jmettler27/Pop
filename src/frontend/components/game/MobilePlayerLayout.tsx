'use client';

import BackgroundContainer from '@/frontend/components/game/BackgroundContainer';
import MobileGameStateControl from '@/frontend/components/game/mobile/MobileGameStateControl';

export default function MobilePlayerLayout() {
  return (
    <div className="relative h-dvh w-full">
      <BackgroundContainer />
      <div className="relative flex flex-col h-full w-full">
        <MobileGameStateControl />
      </div>
    </div>
  );
}
