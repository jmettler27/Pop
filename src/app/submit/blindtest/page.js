'use client'

import React, { useRef, useState } from 'react';
import { Form, Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect } from '@/app/components/forms/StyledFormComponents'
import SubmitFormButton from '@/app/components/forms/SubmitFormButton';
import { UploadAudio, UploadImage } from '@/app/components/forms/UploadFile';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';
import { getFileFromRef, audioFileSchema, imageFileSchema } from '@/lib/utils/files';
import { BLINDTEST_ANSWER_AUTHOR_EXAMPLE, BLINDTEST_ANSWER_AUTHOR_MAX_LENGTH, BLINDTEST_ANSWER_TITLE_MAX_LENGTH, BLINDTEST_ANSWER_SOURCE_EXAMPLE, BLINDTEST_ANSWER_SOURCE_MAX_LENGTH, BLINDTEST_ANSWER_TITLE_EXAMPLE, BLINDTEST_TYPE_TO_TITLE, subtypeSchema, BLINDTEST_TITLE_EXAMPLE, BLINDTEST_TITLE_MAX_LENGTH, BLINDTEST_TYPE_TO_EMOJI } from '@/lib/utils/question/blindtest';


import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { serverTimestamp } from 'firebase/firestore';
import { addNewQuestion } from '@/lib/firebase/firestore';
import { updateQuestionAudio, updateQuestionImage } from '@/lib/firebase/storage';
import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
import { QUESTION_TITLE_LABEL, SUBMIT_QUESTION_BUTTON_LABEL } from '@/lib/utils/submit';



const QUESTION_TYPE = 'blindtest'

export default function Page({ lang = 'fr-FR' }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitBlindtestQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    )
}

export function SubmitBlindtestQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitBlindtestQuestion, isSubmitting] = useAsyncAction(async (values, imageFileRef, audioFileRef) => {
        try {
            const image = getFileFromRef(imageFileRef);

            const audio = getFileFromRef(audioFileRef);
            if (!audio) {
                throw new Error("No audio file");
            }

            const { audioFiles, imageFiles, topic, lang, ...details } = values;
            const { title, answer_title, answer_source, answer_author, subtype } = details;
            const questionId = await addNewQuestion({
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
                createdAt: serverTimestamp(),
                createdBy: userId,
                approved: true
            })
            if (image) {
                await updateQuestionImage(questionId, image, true);
            }
            await updateQuestionAudio(questionId, audio);
            if (props.inGameEditor) {
                await addGameQuestion(props.gameId, props.roundId, questionId, userId)
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
        title: stringSchema(BLINDTEST_ANSWER_TITLE_MAX_LENGTH),
        answer_title: stringSchema(BLINDTEST_ANSWER_TITLE_MAX_LENGTH),
        answer_source: stringSchema(BLINDTEST_ANSWER_SOURCE_MAX_LENGTH),
        answer_author: stringSchema(BLINDTEST_ANSWER_AUTHOR_MAX_LENGTH, false),
        imageFiles: imageFileSchema(imageFileRef),
        audioFiles: audioFileSchema(audioFileRef),
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
                    {Object.entries(BLINDTEST_TYPE_TO_TITLE['en']).map(([subtype, title]) => (
                        <option key={subtype} value={subtype}>{BLINDTEST_TYPE_TO_EMOJI[subtype]} {title}</option>
                    ))}
                </MySelect>

                <MyTextInput
                    label={QUESTION_TITLE_LABEL[lang]}
                    name='title'
                    type='text'
                    placeholder={BLINDTEST_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={BLINDTEST_ANSWER_TITLE[lang]}
                    name='answer_title'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_ANSWER_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={BLINDTEST_ANSWER_SOURCE[lang]}
                    name='answer_source'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_SOURCE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_ANSWER_SOURCE_MAX_LENGTH}
                />

                <MyTextInput
                    label={BLINDTEST_ANSWER_AUTHOR[lang]}
                    name='answer_author'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_AUTHOR_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_ANSWER_AUTHOR_MAX_LENGTH}
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