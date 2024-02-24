'use client'

import React, { useRef } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import { MyTextInput } from '@/app/components/forms/StyledFormComponents'
import { UploadImage } from '@/app/components/forms/UploadFile';
import SubmitFormButton from '@/app/components/forms/SubmitFormButton';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';
import { getFileFromRef, imageFileSchema } from '@/lib/utils/files';
import { IMAGE_ANSWER_EXAMPLE, IMAGE_ANSWER_MAX_LENGTH, IMAGE_TITLE_EXAMPLE, IMAGE_TITLE_MAX_LENGTH } from '@/lib/utils/question/image';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { updateQuestionImage } from '@/lib/firebase/storage';
import { serverTimestamp } from 'firebase/firestore';
import { handleImageFormSubmission, handleQuestionFormSubmission } from '@/app/submit/actions';

import SelectLanguage from '@/app/submit/components/SelectLanguage';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';

const QUESTION_TYPE = 'image'


export default function Page({ }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} />
            <SubmitImageQuestionForm userId={session.user.id} inSubmitPage={true} />
        </>
    )
}

export function SubmitImageQuestionForm({ userId, ...props }) {
    const router = useRouter()

    const [submitImageQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
        try {
            // await handleImageFormSubmission(values, session.user.id, fileRef)
            const image = getFileFromRef(fileRef);
            if (!image) {
                throw new Error("No image file");
            }
            const { files, topic, lang, ...details } = values;
            const questionId = await addNewQuestion({
                details: { ...details },
                type: QUESTION_TYPE,
                topic,
                // subtopics,
                lang,
                createdAt: serverTimestamp(),
                createdBy: userId,
                approved: true
            })
            await updateQuestionImage(questionId, image);
            if (props.inGameEditor) {
                await addGameQuestion(props.gameId, props.roundId, questionId, userId)
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    });

    const fileRef = useRef(null);

    const validationSchema = Yup.object({
        lang: localeSchema(),
        topic: topicSchema(),
        title: stringSchema(IMAGE_TITLE_MAX_LENGTH),
        answer: stringSchema(IMAGE_ANSWER_MAX_LENGTH),
        files: imageFileSchema(fileRef),
    })

    return (
        <Formik
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                title: '',
                answer: '',
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
                <SelectLanguage lang='en' name='lang' validationSchema={validationSchema} />

                <SelectQuestionTopic lang='en' name='topic' validationSchema={validationSchema} />

                <MyTextInput
                    label="What is the question?"
                    name='title'
                    type='text'
                    placeholder={IMAGE_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={IMAGE_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label="What is the answer?"
                    name='answer'
                    type='text'
                    placeholder={IMAGE_ANSWER_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={IMAGE_ANSWER_MAX_LENGTH}
                />

                <UploadImage fileRef={fileRef} name='files' validationSchema={validationSchema} />

                <SubmitFormButton isSubmitting={isSubmitting} />
            </Form>
        </Formik >
    );

}