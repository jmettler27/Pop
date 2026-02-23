import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/controller/BuzzerHeadPlayer';

export default function BuzzerSpectatorController({ questionPlayers }) {
  const { buzzed } = questionPlayers;

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <BuzzerHeadPlayer buzzed={buzzed} />
    </div>
  );
}
