import { MySelect } from '@/app/components/forms/StyledFormComponents'
import { QUESTION_TYPES, prependQuestionTypeWithEmoji } from '@/lib/utils/question_types'

export default function SelectRoundType({ validationSchema, lang = 'en', name = 'type' }) {
    return (
        <MySelect
            label={LABEL[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{HEADER[lang]}</option>
            {QUESTION_TYPES.map((roundType) => <option key={roundType} value={roundType}>{prependQuestionTypeWithEmoji(roundType, lang)}</option>)}
        </MySelect>
    )
}

const LABEL = {
    'en': "What is the type of the round?",
    'fr-FR': "Quel est le type de la manche?"
}

const HEADER = {
    'en': "Select the type of the round",
    'fr-FR': "Sélectionnez le type de la manche"
}