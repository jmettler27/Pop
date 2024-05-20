import PlayerName from '@/app/(game)/[id]/components/PlayerName'


export default function BuzzerHeadPlayer({ buzzed, lang = 'fr-FR' }) {

    if (buzzed.length === 0) {
        return <span className='text-3xl opacity-50'>{NO_BUZZERS_YET_TEXT[lang]}</span>
    }

    return <span className='text-3xl'><PlayerName playerId={buzzed[0]} /></span>
}

const NO_BUZZERS_YET_TEXT = {
    'en': "No one has guessed yet",
    'fr-FR': "Personne n'a encore deviné"
}