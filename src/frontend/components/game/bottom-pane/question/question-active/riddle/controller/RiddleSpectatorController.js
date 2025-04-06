import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'

export default function RiddleSpectatorController({ players }) {
    const { buzzed } = players

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <BuzzerHeadPlayer buzzed={buzzed} />
        </div>
    );
}
