import { GAME_TYPES, prependGameTypeWithEmoji } from '@/backend/utils/game'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'
import { MySelect } from '@/frontend/components/forms/StyledFormComponents'

export default function SelectGameType({ validationSchema, lang = DEFAULT_LOCALE, name = 'type' }) {
    return (
        <MySelect
            label={LABEL[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{HEADER[lang]}</option>
            {GAME_TYPES.map((gameType) => <option key={gameType} value={gameType}>{prependGameTypeWithEmoji(gameType)}</option>)}
        </MySelect>
    )
}

const LABEL = {
    'en': "Type of the game",
    'fr-FR': "Type de la partie"
}

const HEADER = {
    'en': "Select the type of game",
    'fr-FR': "Sélectionnez le type de la partie"
}