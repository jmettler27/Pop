import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ImageQuestion } from '@/backend/models/questions/Image';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/game-editor/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/topics';
import { QUESTION_TITLE_LABEL, SUBMIT_QUESTION_BUTTON_LABEL } from '@/frontend/utils/forms/questions';
import { stringSchema } from '@/frontend/utils/forms/forms';
import { getFileFromRef, imageFileSchema } from '@/frontend/utils/forms/files';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import { MyTextInput } from '@/frontend/components/forms/StyledFormComponents'
import { UploadImage } from '@/frontend/components/forms/UploadFile';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';


import { useRouter } from 'next/navigation'

import React, { useRef } from 'react';

import { Form, Formik } from 'formik';
import * as Yup from 'yup';


const QUESTION_TYPE = QuestionType.IMAGE;

const IMAGE_TITLE_EXAMPLE = {
    'en': "Object + Video game",
    'fr-FR': "Objet + Jeu vidéo"
}
const IMAGE_ANSWER_SOURCE_EXAMPLE = {
    'en': "Elden Ring",
    'fr-FR': "Elden Ring"
}

const IMAGE_ANSWER_DESCRIPTION_EXAMPLE = {
    'en': "Flask of Wondrous Physick",
    'fr-FR': "Fiole de salut miraculeux"
}

export default function SubmitImageQuestionForm({ userId, lang = DEFAULT_LOCALE, ...props }) {
    const router = useRouter()

    const [submitImageQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
        try {
            // await handleImageFormSubmission(values, session.user.id, fileRef)
            const image = getFileFromRef(fileRef);
            if (!image) {
                throw new Error("No image file");
            }
            const { files, topic, lang, ...details } = values;
            const { title, answer_description, answer_source } = details;

            const questionId = await submitQuestion(
                {
                    details: {
                        title,
                        answer: {
                            description: answer_description,
                            source: answer_source,
                        },
                    },
                    type: QUESTION_TYPE,
                    topic,
                    // subtopics,
                    lang,
                }, 
                userId,
                {
                    image: image
                }
            );
            if (props.inGameEditor) {
                await addQuestionToRound(props.gameId, props.roundId, questionId, userId)
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    });

    const fileRef = useRef(null);

    const validationSchema = Yup.object({
        lang: localeSchema(),
        topic: topicSchema(),
        title: stringSchema(ImageQuestion.TITLE_MAX_LENGTH),
        answer_description: stringSchema(ImageQuestion.ANSWER_DESCRIPTION_MAX_LENGTH, false),
        answer_source: stringSchema(ImageQuestion.ANSWER_SOURCE_MAX_LENGTH),
        files: imageFileSchema(fileRef, true),
    })

    return (
        <Formik
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                title: '',
                answer_description: '',
                answer_source: '',
                files: '',
            }}
            onSubmit={async values => {
                await submitImageQuestion(values, fileRef)
                if (props.inSubmitPage) {
                    router.push('/submit/')
                } else if (props.inGameEditor) {
                    props.onDialogClose()
                }
            }}
            validationSchema={validationSchema}
        >
            <Form>
                <SelectLanguage lang={lang} name='lang' validationSchema={validationSchema} />

                <SelectQuestionTopic lang={lang} name='topic' validationSchema={validationSchema} />

                <MyTextInput
                    label={QUESTION_TITLE_LABEL[lang]}
                    name='title'
                    type='text'
                    placeholder={IMAGE_TITLE_EXAMPLE[lang]}
                    validationSchema={validationSchema}
                    maxLength={ImageQuestion.TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={IMAGE_ANSWER_DESCRIPTION_LABEL[lang]}
                    name='answer_description'
                    type='text'
                    placeholder={IMAGE_ANSWER_DESCRIPTION_EXAMPLE[lang]}
                    validationSchema={validationSchema}
                    maxLength={ImageQuestion.ANSWER_DESCRIPTION_MAX_LENGTH}
                />

                <MyTextInput
                    label={IMAGE_ANSWER_SOURCE_LABEL[lang]}
                    name='answer_source'
                    type='text'
                    placeholder={IMAGE_ANSWER_SOURCE_EXAMPLE[lang]}
                    validationSchema={validationSchema}
                    maxLength={ImageQuestion.ANSWER_SOURCE_MAX_LENGTH}
                />

                <UploadImage fileRef={fileRef} name='files' validationSchema={validationSchema} lang={lang} />

                <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_QUESTION_BUTTON_LABEL[lang]} />
            </Form>
        </Formik >
    );

}

const IMAGE_ANSWER_DESCRIPTION_LABEL = {
    'en': "Description of the image",
    'fr-FR': "Description de l'image",
}

const IMAGE_ANSWER_SOURCE_LABEL = {
    'en': "Source of the image",
    'fr-FR': "Source de l'image",
}