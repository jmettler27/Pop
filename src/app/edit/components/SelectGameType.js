import { MySelect } from '@/app/components/forms/StyledFormComponents'
import { GAME_TYPES, prependGameTypeWithEmoji } from '@/lib/utils/game'

export default function SelectGameType({ validationSchema, lang = 'fr-FR', name = 'type' }) {
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
    'en': "What is the type of game?",
    'fr-FR': "Quel est le type de partie?"
}

const HEADER = {
    'en': "Select the type of game",
    'fr-FR': "Sélectionnez le type de la partie"
}