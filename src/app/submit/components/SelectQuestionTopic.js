import { MySelect } from '@/app/components/forms/StyledFormComponents'

import { allTopicsToTitle } from '@/lib/utils/topics';

export default function SelectQuestionTopic({ validationSchema, lang = 'fr-FR', name = 'topic' }) {
    return (
        <MySelect
            label={SELECT_QUESTION_TOPIC_LABEL[lang]}
            name={name}
            validationSchema={validationSchema}
        >
            <option value="">{SELECT_QUESTION_TOPIC_HEADER[lang]}</option>
            {allTopicsToTitle(lang).map(([topic, title]) => <option key={topic} value={topic}>{title}</option>)}
        </MySelect>
    )
}

const SELECT_QUESTION_TOPIC_LABEL = {
    'en': "Topic of the question",
    'fr-FR': "Sujet de la question"
}

const SELECT_QUESTION_TOPIC_HEADER = {
    'en': "Select the topic",
    'fr-FR': "Sélectionnez le sujet"
}