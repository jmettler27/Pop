import { MySelect } from '@/frontend/components/forms/StyledFormComponents'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';
import { prependScorePolicyTypeWithEmoji, ScorePolicyType } from '@/backend/models/ScorePolicy';

export default function SelectRoundScorePolicy({ validationSchema, lang = DEFAULT_LOCALE, name = 'roundScorePolicy' }) {
    return (
        <MySelect
            label={SELECT_SCORE_POLICY_LABEL[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{SELECT_SCORE_POLICY_HEADER[lang]}</option>
            {Object.values(ScorePolicyType).map((policy) => <option key={policy} value={policy}>{prependScorePolicyTypeWithEmoji(policy)}</option>)}
        </MySelect>
    )
}

const SELECT_SCORE_POLICY_LABEL = {
    'en': "Round score policy",
    'fr-FR': "Politique de score pour la manche"
}

const SELECT_SCORE_POLICY_HEADER = {
    'en': "Select the round score policy",
    'fr-FR': "Sélectionnez la politique de score pour la manche"
}

