import { MySelect } from '@/app/components/forms/StyledFormComponents'

import { LOCALES, prependLocaleWithEmoji } from '@/lib/utils/locales';

export default function SelectLanguage({ validationSchema, labels = QUESTION_LANGUAGE_SELECTOR_LABELS, lang = 'fr-FR', name = 'lang' }) {
    return (
        <MySelect
            label={labels[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{HEADER[lang]}</option>
            {LOCALES.map((locale) => <option key={locale} value={locale}>{prependLocaleWithEmoji(locale)}</option>)}
        </MySelect>
    )
}

const QUESTION_LANGUAGE_SELECTOR_LABELS = {
    'en': "What language is this question in?",
    'fr-FR': "Dans quelle langue est cette question?"
}

const HEADER = {
    'en': "Select a language",
    'fr-FR': "Sélectionnez une langue"
}