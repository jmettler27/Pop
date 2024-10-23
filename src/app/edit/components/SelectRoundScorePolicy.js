import { MySelect } from '@/app/components/forms/StyledFormComponents'

import { DEFAULT_LOCALE } from '@/lib/utils/locales';
import { prependRoundScorePolicyWithEmoji, ROUND_SCORE_POLICIES } from '@/lib/utils/scores';

export default function SelectRoundScorePolicy({ validationSchema, lang = DEFAULT_LOCALE, name = 'roundScorePolicy' }) {
    return (
        <MySelect
            label={SELECT_SCORE_POLICY_LABEL[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{SELECT_SCORE_POLICY_HEADER[lang]}</option>
            {ROUND_SCORE_POLICIES.map((policy) => <option key={policy} value={policy}>{prependRoundScorePolicyWithEmoji(policy)}</option>)}
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