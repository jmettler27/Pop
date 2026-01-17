import { QuestionType } from '@/backend/models/questions/QuestionType';
import { BlindtestQuestion, BlindtestType } from '@/backend/models/questions/Blindtest';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';


import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { QUESTION_TITLE_LABEL, SUBMIT_QUESTION_BUTTON_LABEL } from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import { stringSchema } from '@/frontend/utils/forms/forms';
import { getFileFromRef, audioFileSchema, imageFileSchema } from '@/frontend/utils/forms/files';

import { MyTextInput, MySelect } from '@/frontend/components/forms/StyledFormComponents'
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';
import { UploadAudio, UploadImage } from '@/frontend/components/forms/UploadFile';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

import { useRouter } from 'next/navigation'

import React, { useRef } from 'react';
import { Form, Formik } from 'formik';

const BLINDTEST_TITLE_EXAMPLE = "Film"
const BLINDTEST_ANSWER_TITLE_EXAMPLE = "Can You Hear The Music"
const BLINDTEST_ANSWER_SOURCE_EXAMPLE = "Oppenheimer"
const BLINDTEST_ANSWER_AUTHOR_EXAMPLE = "Ludwig Göransson"

const QUESTION_TYPE = QuestionType.BLINDTEST;

/* Validation  */
import * as Yup from 'yup';
const subtypeSchema = () => Yup.string()
    .oneOf(BlindtestType.getAllTypes(), "Invalid question subtype.")
    .required("Required.")


export default function SubmitBlindtestQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitBlindtestQuestion, isSubmitting] = useAsyncAction(async (values, imageFileRef, audioFileRef) => {
        try {
            const audio = getFileFromRef(audioFileRef);
            if (!audio) {
                throw new Error("No audio file");
            }
            const image = getFileFromRef(imageFileRef);

            const { audioFiles, imageFiles, topic, lang, ...details } = values;
            const { title, answer_title, answer_source, answer_author, subtype } = details;
            const questionId = await submitQuestion(
                {
                    details: {
                        title,
                        answer: {
                            title: answer_title,
                            source: answer_source,
                            author: answer_author
                        },
                        subtype
                    },
                    type: QUESTION_TYPE,
                    topic,
                    // subtopics,,
                    lang,
                }, 
                userId,
                {
                    audio: audio,
                    image: image
                }
            );

            if (props.inGameEditor) {
                await addQuestionToRound(props.gameId, props.roundId, questionId, userId)
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    })

    const imageFileRef = useRef(null);
    const audioFileRef = useRef(null);

    const validationSchema = Yup.object({
        lang: localeSchema(),
        topic: topicSchema(),
        subtype: subtypeSchema(),
        title: stringSchema(BlindtestQuestion.TITLE_MAX_LENGTH),
        answer_title: stringSchema(BlindtestQuestion.ANSWER_TITLE_MAX_LENGTH),
        answer_source: stringSchema(BlindtestQuestion.ANSWER_SOURCE_MAX_LENGTH),
        answer_author: stringSchema(BlindtestQuestion.ANSWER_AUTHOR_MAX_LENGTH, false),
        imageFiles: imageFileSchema(imageFileRef, false),
        audioFiles: audioFileSchema(audioFileRef, true),
    })

    return (
        <Formik
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                subtype: '',
                title: '',
                answer_title: '',
                answer_source: '',
                answer_author: '',
                audioFiles: '',
                imageFiles: ''
            }}
            validationSchema={validationSchema}
            onSubmit={async values => {
                await submitBlindtestQuestion(values, imageFileRef, audioFileRef)
                if (props.inSubmitPage)
                    router.push('/submit')
                else if (props.inGameEditor) {
                    props.onDialogClose()
                }
            }}
        >
            <Form>
                <SelectLanguage lang={lang} name='lang' validationSchema={validationSchema} />

                <SelectQuestionTopic lang={lang} name='topic' validationSchema={validationSchema} />

                <MySelect
                    label={BLINDTEST_TYPE[lang]}
                    name='subtype'
                    validationSchema={validationSchema}
                >
                    <option value="">{SELECT_BLINDTEST_TYPE[lang]}</option>
                    {BlindtestType.getAllTypes().map(type => (
                        <option key={type} value={type}>{BlindtestType.getEmoji(type)} {BlindtestType.getTitle(type, lang)}</option>
                    ))}
                </MySelect>

                <MyTextInput
                    label={QUESTION_TITLE_LABEL[lang]}
                    name='title'
                    type='text'
                    placeholder={BLINDTEST_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BlindtestQuestion.TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={BLINDTEST_ANSWER_TITLE[lang]}
                    name='answer_title'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BlindtestQuestion.ANSWER_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={BLINDTEST_ANSWER_AUTHOR[lang]}
                    name='answer_author'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_AUTHOR_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BlindtestQuestion.ANSWER_AUTHOR_MAX_LENGTH}
                />

                <MyTextInput
                    label={BLINDTEST_ANSWER_SOURCE[lang]}
                    name='answer_source'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_SOURCE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BlindtestQuestion.ANSWER_SOURCE_MAX_LENGTH}
                />

                <UploadAudio fileRef={audioFileRef} name='audioFiles' validationSchema={validationSchema} lang={lang} />

                <UploadImage fileRef={imageFileRef} name='imageFiles' validationSchema={validationSchema} lang={lang} />

                <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_QUESTION_BUTTON_LABEL[lang]} />
            </Form>
        </Formik >
    );
}

const BLINDTEST_TYPE = {
    'en': "Type of the blindtest",
    'fr-FR': "Type de blindtest",
}

const SELECT_BLINDTEST_TYPE = {
    'en': "Select the type",
    'fr-FR': "Sélectionnez le type",
}

const BLINDTEST_ANSWER_TITLE = {
    'en': "Title of the audio",
    'fr-FR': "Titre de l'audio",
}

const BLINDTEST_ANSWER_SOURCE = {
    'en': "Source of the audio",
    'fr-FR': "Source de l'audio",
}

const BLINDTEST_ANSWER_AUTHOR = {
    'en': "Author of the audio",
    'fr-FR': "Auteur de l'audio",
}