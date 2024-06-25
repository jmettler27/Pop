import PlayerName from '@/app/(game)/[id]/components/PlayerName'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'


export default function BuzzerHeadPlayer({ buzzed, lang = DEFAULT_LOCALE }) {

    if (buzzed.length === 0) {
        return <span className='2xl:text-4xl opacity-50'>{NO_BUZZERS_YET_TEXT[lang]}</span>
    }

    return <span className='2xl:text-4xl'><PlayerName playerId={buzzed[0]} /></span>
}

const NO_BUZZERS_YET_TEXT = {
    'en': "No one has guessed yet",
    'fr-FR': "Personne n'a encore deviné"
}