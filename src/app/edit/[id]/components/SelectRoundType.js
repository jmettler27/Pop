import { MySelect } from '@/app/components/forms/StyledFormComponents'
import { prependRoundTypeWithEmoji, ROUND_TYPES } from '@/lib/utils/round'

export default function SelectRoundType({ validationSchema, lang, name = 'type' }) {
    return (
        <MySelect
            label={SELECT_ROUND_LABEL[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{SELECT_ROUND_HEADER[lang]}</option>
            {ROUND_TYPES.map((roundType) => <option key={roundType} value={roundType}>{prependRoundTypeWithEmoji(roundType, lang)}</option>)}
        </MySelect>
    )
}

const SELECT_ROUND_LABEL = {
    'en': "Type of the round",
    'fr-FR': "Type de la manche"
}

const SELECT_ROUND_HEADER = {
    'en': "Select the type of round",
    'fr-FR': "Sélectionnez le type de manche"
}