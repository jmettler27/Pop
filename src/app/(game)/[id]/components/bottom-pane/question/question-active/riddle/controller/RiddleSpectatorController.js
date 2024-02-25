
import BuzzerHeadPlayer from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'

export default function RiddleSpectatorController({ players }) {
    const buzzed = players.buzzed;

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <BuzzerHeadPlayer buzzed={buzzed} />
        </div>
    );
}
