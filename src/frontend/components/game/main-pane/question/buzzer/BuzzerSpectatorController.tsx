import BuzzerHeadPlayer from '@/frontend/components/game/main-pane/question/buzzer/BuzzerHeadPlayer';

interface BuzzerSpectatorControllerProps {
  questionPlayers: Record<string, unknown>;
}

export default function BuzzerSpectatorController({ questionPlayers }: BuzzerSpectatorControllerProps) {
  const { buzzed } = questionPlayers as { buzzed: string[] };

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <BuzzerHeadPlayer buzzed={buzzed} />
    </div>
  );
}
