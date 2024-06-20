'use client'

import React, { useRef } from 'react';
import { Field, FieldArray, Form, Formik, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect, StyledErrorMessage } from '@/app/components/forms/StyledFormComponents'
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';
import {
    MCQ_CHOICES_EXAMPLE, MCQ_CHOICE_MAX_LENGTH,
    MCQ_EXPLANATION_EXAMPLE, MCQ_EXPLANATION_MAX_LENGTH,
    MCQ_NOTE_EXAMPLE, MCQ_NOTE_MAX_LENGTH,
    MCQ_SOURCE_EXAMPLE, MCQ_SOURCE_MAX_LENGTH,
    MCQ_TITLE_EXAMPLE, MCQ_TITLE_MAX_LENGTH
} from '@/lib/utils/question/mcq';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
import { imageFileSchema } from '@/lib/utils/files';
import SubmitFormButton from '@/app/components/forms/SubmitFormButton';
import { UploadImage } from '@/app/components/forms/UploadFile';

const QUESTION_TYPE = 'basic'


export default function Page({ params }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} />
            <SubmitBasicQuestionForm userId={session.user.id} inSubmitPage={true} />
        </>
    );
}


export function SubmitBasicQuestionForm({ userId, ...props }) {
    const router = useRouter()

    const [submitBasicQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values
            const questionId = await addNewQuestion({
                details: { ...details },
                type: QUESTION_TYPE,
                topic,
                lang,
                createdAt: serverTimestamp(),
                createdBy: userId,
                approved: true
            })
            if (props.inGameEditor) {
                await addGameQuestion(props.gameId, props.roundId, questionId, userId)
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    })

    const validationSchema = Yup.object({
        lang: localeSchema(),
        topic: topicSchema(),
        source: stringSchema(MCQ_SOURCE_MAX_LENGTH, false),
        title: stringSchema(MCQ_TITLE_MAX_LENGTH),
        note: stringSchema(MCQ_NOTE_MAX_LENGTH, false),
        answer: stringSchema(MCQ_CHOICE_MAX_LENGTH),
        explanation: stringSchema(MCQ_EXPLANATION_MAX_LENGTH, false),
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

                <SelectLanguage lang='fr-FR' name='lang' validationSchema={validationSchema} />

                <SelectQuestionTopic lang='fr-FR' name='topic' validationSchema={validationSchema} />

                <MyTextInput
                    label="To what work is this question related to?"
                    name='source'
                    type='text'
                    placeholder={MCQ_SOURCE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={MCQ_SOURCE_MAX_LENGTH}
                />

                <MyTextInput
                    label="What is the title of the question?"
                    name='title'
                    type='text'
                    placeholder={MCQ_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={MCQ_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label="Do you have any hints/remarks to make?"
                    name='note'
                    type='text'
                    placeholder={MCQ_NOTE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={MCQ_NOTE_MAX_LENGTH}
                />

                <MyTextInput
                    label="What is the answer?"
                    name='answer'
                    type='text'
                    placeholder={MCQ_CHOICES_EXAMPLE[0]}
                    validationSchema={validationSchema}
                    maxLength={MCQ_CHOICE_MAX_LENGTH}
                />

                <MyTextInput
                    label="Give an explanation"
                    name='explanation'
                    type='text'
                    placeholder={MCQ_EXPLANATION_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={MCQ_EXPLANATION_MAX_LENGTH}
                />

                <SubmitFormButton isSubmitting={isSubmitting} />

            </Form>
        </Formik>
    )
}
