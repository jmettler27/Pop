import { MySelect } from '@/app/components/forms/StyledFormComponents'

import { allTopicsToTitle } from '@/lib/utils/topics';

export default function SelectQuestionTopic({ validationSchema, lang = 'en', name = 'topic' }) {
    return (
        <MySelect
            label={LABEL[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{HEADER[lang]}</option>
            {allTopicsToTitle(lang).map(([topic, title]) => <option key={topic} value={topic}>{title}</option>)}
        </MySelect>
    )
}

const LABEL = {
    'en': "What topic is this question related to?",
    'fr-FR': "À quel sujet cette question est-elle liée?"
}

const HEADER = {
    'en': "Select a topic",
    'fr-FR': "Sélectionnez un sujet"
}