import EnumerationController from '@/frontend/components/game/bottom-pane/question/question-active/enumeration/EnumerationController';
import EnumerationPlayers from '@/frontend/components/game/bottom-pane/question/question-active/enumeration/EnumerationPlayers';

export default function EnumerationBottomPane({ baseQuestion }) {
  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-4/5 max-h-full overflow-auto">
        <EnumerationController baseQuestion={baseQuestion} />
      </div>

      {/* Right part: list of bets */}
      <div className="basis-1/5 max-h-full overflow-auto">
        <EnumerationPlayers />
      </div>
    </div>
  );
}
