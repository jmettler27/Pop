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



const QUESTION_TYPE = 'blindtest'

export default function Page({ params }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} />
            <SubmitBlindtestQuestionForm userId={session.user.id} inSubmitPage={true} />
        </>
    )
}

export function SubmitBlindtestQuestionForm({ userId, ...props }) {
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
                <SelectLanguage lang='fr-FR' name='lang' validationSchema={validationSchema} />

                <SelectQuestionTopic lang='fr-FR' name='topic' validationSchema={validationSchema} />

                <MySelect
                    label="What kind of blindtest is this?"
                    name='subtype'
                    validationSchema={validationSchema}
                >
                    <option value="">Select a type</option>
                    {Object.entries(BLINDTEST_TYPE_TO_TITLE['en']).map(([subtype, title]) => (
                        <option key={subtype} value={subtype}>{BLINDTEST_TYPE_TO_EMOJI[subtype]} {title}</option>
                    ))}
                </MySelect>

                <MyTextInput
                    label="What is the question?"
                    name='title'
                    type='text'
                    placeholder={BLINDTEST_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label="Title of the audio"
                    name='answer_title'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_ANSWER_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label="Where does this audio come from?"
                    name='answer_source'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_SOURCE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_ANSWER_SOURCE_MAX_LENGTH}
                />

                <MyTextInput
                    label="Who made this audio?"
                    name='answer_author'
                    type='text'
                    placeholder={BLINDTEST_ANSWER_AUTHOR_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={BLINDTEST_ANSWER_AUTHOR_MAX_LENGTH}
                />

                <UploadAudio fileRef={audioFileRef} name='audioFiles' validationSchema={validationSchema} />

                <UploadImage fileRef={imageFileRef} name='imageFiles' validationSchema={validationSchema} />

                <SubmitFormButton isSubmitting={isSubmitting} />
            </Form>
        </Formik >
    );
}
