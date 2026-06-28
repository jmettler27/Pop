'use client';

import MobileGameStateControl from '@/frontend/components/game/mobile/MobileGameStateControl';

export default function MobilePlayerLayout() {
  return (
    <div className="flex flex-col h-dvh w-full bg-slate-900">
      <MobileGameStateControl />
    </div>
  );
}
