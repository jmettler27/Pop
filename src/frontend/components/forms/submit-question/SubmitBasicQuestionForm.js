import { BasicQuestion } from '@/backend/models/questions/Basic';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/game-editor/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { QUESTION_ANSWER_LABEL, QUESTION_TITLE_LABEL, SUBMIT_QUESTION_BUTTON_LABEL, QUESTION_HINTS_REMARKS, QUESTION_SOURCE_LABEL, QUESTION_EXPLANATION_LABEL } from '@/frontend/utils/forms/questions';


import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import { stringSchema } from '@/frontend/utils/forms/forms';

import { MyTextInput } from '@/frontend/components/forms/StyledFormComponents'
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';

import { useRouter } from 'next/navigation'


const BASIC_QUESTION_SOURCE_EXAMPLE = {
    'en': "Minecraft",
    'fr-FR': "Minecraft"
}

const BASIC_QUESTION_TITLE_EXAMPLE = {
    'en': "How much sand is needed to craft sandstone?",
    'fr-FR': "Combien de sable est nécessaire pour fabriquer du grès?"
}

const BASIC_QUESTION_ANSWER_EXAMPLE = {
    'en': "4",
    'fr-FR': "4"
}




export default function SubmitBasicQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitBasicQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values
            const questionId = await submitQuestion(
                {
                    details: { ...details },
                    type: QUESTION_TYPE,
                    topic,
                    lang,
                },
                userId
            );
            if (props.inGameEditor) {
                await addQuestionToRound(props.gameId, props.roundId, questionId, userId)
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    })

    const validationSchema = Yup.object({
        lang: localeSchema(),
        topic: topicSchema(),
        source: stringSchema(BasicQuestion.SOURCE_MAX_LENGTH, false),
        title: stringSchema(BasicQuestion.TITLE_MAX_LENGTH),
        note: stringSchema(BasicQuestion.NOTE_MAX_LENGTH, false),
        answer: stringSchema(BasicQuestion.ANSWER_MAX_LENGTH),
        explanation: stringSchema(BasicQuestion.EXPLANATION_MAX_LENGTH, false),
    })

    return (
        <Formik
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                source: '',
                title: '',
                note: '',
                answer: '',
                explanation: '',
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
                await submitBasicQuestion(values)
                if (props.inSubmitPage) {
                    router.push('/submit')
                } else if (props.inGameEditor) {
                    props.onDialogClose()
                }
            }}
        >

            <Form>

                <SelectLanguage lang={lang} name='lang' validationSchema={validationSchema} />

                <SelectQuestionTopic lang={lang} name='topic' validationSchema={validationSchema} />

                <MyTextInput
                    label={QUESTION_SOURCE_LABEL[lang]}
                    name='source'
                    type='text'
                    placeholder={BASIC_QUESTION_SOURCE_EXAMPLE[lang]}
                    validationSchema={validationSchema}
                    maxLength={BasicQuestion.SOURCE_MAX_LENGTH}
                />

                <MyTextInput
                    label={QUESTION_TITLE_LABEL[lang]}
                    name='title'
                    type='text'
                    placeholder={BASIC_QUESTION_TITLE_EXAMPLE[lang]}
                    validationSchema={validationSchema}
                    maxLength={BasicQuestion.TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={QUESTION_HINTS_REMARKS[lang]}
                    name='note'
                    type='text'
                    // placeholder={MCQ_NOTE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BasicQuestion.NOTE_MAX_LENGTH}
                />

                <MyTextInput
                    label={QUESTION_ANSWER_LABEL[lang]}
                    name='answer'
                    type='text'
                    placeholder={BASIC_QUESTION_ANSWER_EXAMPLE[lang]}
                    validationSchema={validationSchema}
                    maxLength={BasicQuestion.ANSWER_MAX_LENGTH}
                />

                <MyTextInput
                    label={QUESTION_EXPLANATION_LABEL[lang]}
                    name='explanation'
                    type='text'
                    // placeholder={MCQ_EXPLANATION_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BasicQuestion.EXPLANATION_MAX_LENGTH}
                />

                <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_QUESTION_BUTTON_LABEL[lang]} />
            </Form>
        </Formik>
    )
}
