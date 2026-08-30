'use client';

import BackgroundContainer from '@/components/game/BackgroundContainer';
import MobileGameStateControl from '@/components/game/mobile/MobileGameStateControl';

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
