import { useRoleContext } from '@/app/(game)/contexts'

export default function QuestionEndWait({ isRoundEnd, lang = 'en' }) {
    const myRole = useRoleContext();

    if (myRole === 'player') {
        return <span className='text-3xl'>{QUESTION_END_WAITING_PLAYER_START[lang]} <strong>{isRoundEnd ? QUESTION_END_WAITING_PLAYER_ROUND_END[lang] : QUESTION_END_WAITING_PLAYER_NEXT_QUESTIOn[lang]}</strong>? 🥸</span>
    }
    return <span className='text-3xl'>{QUESTION_END_WAITING_TEXT[lang]}</span>
}

const QUESTION_END_WAITING_PLAYER_START = {
    'en': "Ready for",
    'fr-FR': "Chaud pour"
}

const QUESTION_END_WAITING_PLAYER_ROUND_END = {
    'en': "the end of the round",
    'fr-FR': "la fin de la manche"
}

const QUESTION_END_WAITING_PLAYER_NEXT_QUESTIOn = {
    'en': "the next question",
    'fr-FR': "la prochaine question"
}

const QUESTION_END_WAITING_TEXT = {
    'en': "Waiting for players...",
    'fr-FR': "En attente des joueurs..."
}