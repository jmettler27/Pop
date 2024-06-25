'use client'

import React, { useRef } from 'react';
import { Form, Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyEmojiTextInput, MyTextInput } from '@/app/components/forms/StyledFormComponents'
import { UploadImage } from '@/app/components/forms/UploadFile';
import SubmitFormButton from '@/app/components/forms/SubmitFormButton';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';
import { getFileFromRef, imageFileSchema } from '@/lib/utils/files';
import { EMOJI_ANSWER_TITLE_EXAMPLE, EMOJI_ANSWER_TITLE_MAX_LENGTH, EMOJI_CLUE_EXAMPLE, EMOJI_CLUE_MAX_LENGTH, EMOJI_CLUE_MIN_LENGTH, EMOJI_TITLE_EXAMPLE, EMOJI_TITLE_MAX_LENGTH, emojiClueSchema } from '@/lib/utils/question/emoji';
import { QUESTION_ANSWER_LABEL, QUESTION_TITLE_LABEL, SUBMIT_QUESTION_BUTTON_LABEL } from '@/lib/utils/submit';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { updateQuestionImage } from '@/lib/firebase/storage';
import { serverTimestamp } from 'firebase/firestore';

import { useAsyncAction } from '@/lib/utils/async';

const QUESTION_TYPE = 'emoji'

export default function Page({ lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitEmojiQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    )
}

export function SubmitEmojiQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const fileRef = useRef(null);

    const [submitEmojiQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
        try {
            const image = getFileFromRef(fileRef);
            if (!image) {
                throw new Error("No image file");
            }
            const { files, topic, lang, ...details } = values;
            const { title, clue, answer_title } = details;
            const questionId = await addNewQuestion({
                details: {
                    title,
                    clue,
                    answer: { title: answer_title }
                },
                type: QUESTION_TYPE,
                topic,
                // subtopics,,
                lang,
                createdAt: serverTimestamp(),
                createdBy: userId,
                approved: true
            })
            await updateQuestionImage(questionId, image, true);
            if (props.inGameEditor) {
                await addGameQuestion(props.gameId, props.roundId, questionId, userId);
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    })

    const validationSchema = Yup.object({
        lang: localeSchema(),
        topic: topicSchema(),
        title: stringSchema(EMOJI_TITLE_MAX_LENGTH),
        answer_title: stringSchema(EMOJI_ANSWER_TITLE_MAX_LENGTH),
        clue: emojiClueSchema(),
        files: imageFileSchema(fileRef),
    })

    return (
        <Formik
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                title: '',
                answer_title: '',
                clue: '',
                files: '',
            }}
            onSubmit={async values => {
                await submitEmojiQuestion(values, fileRef)
                if (props.inSubmitPage)
                    router.push('/submit')
                else if (props.inGameEditor) {
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
                    placeholder={EMOJI_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={EMOJI_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={QUESTION_ANSWER_LABEL[lang]}
                    name='answer_title'
                    type='text'
                    placeholder={EMOJI_ANSWER_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={EMOJI_ANSWER_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label="Emojis"
                    name='clue'
                    type='text'
                    placeholder={EMOJI_CLUE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={EMOJI_CLUE_MAX_LENGTH}
                    onlyEmojis={true}
                />

                {/* Clue */}
                <EmojiPicker />

                {/* Image */}
                <UploadImage fileRef={fileRef} name='files' validationSchema={validationSchema} lang={lang} />

                <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_QUESTION_BUTTON_LABEL[lang]} />
            </Form>
        </Formik >
    );
}

import emojiRegex from 'emoji-regex';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
const regex = emojiRegex();


function EmojiPicker() {
    const formik = useFormikContext();

    // TODO: i8n

    return (
        <Picker
            data={data}
            onEmojiSelect={(emoji) => {
                formik.setFieldValue('clue', formik.values.clue + emoji.native);
            }}
        />
    )
}
