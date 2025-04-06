import { QuestionType } from '@/backend/models/questions/QuestionType';
import { EmojiQuestion } from '@/backend/models/questions/Emoji';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/game-editor/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/topics';
import { QUESTION_ANSWER_LABEL, QUESTION_TITLE_LABEL, SUBMIT_QUESTION_BUTTON_LABEL } from '@/frontend/utils/forms/questions';

import { stringSchema } from '@/frontend/utils/forms/forms';
import { getFileFromRef, imageFileSchema } from '@/frontend/utils/forms/files';



import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import { MyTextInput } from '@/frontend/components/forms/StyledFormComponents'
import { UploadImage } from '@/frontend/components/forms/UploadFile';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

import { useRouter } from 'next/navigation'

import React, { useRef } from 'react';

import * as Yup from 'yup'

import { Form, Formik, useFormikContext } from 'formik';

import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'


const QUESTION_TYPE = QuestionType.EMOJI;

const EMOJI_TITLE_EXAMPLE = "Film"
const EMOJI_CLUE_EXAMPLE = "🚢🎻🧊"
const EMOJI_ANSWER_TITLE_EXAMPLE = "Titanic"


import { emojiCount, onlyEmojis } from '@/backend/utils/emojis';


/* Indicator on the number of emojis being written in a string field composed only of emojis */
export const numEmojisIndicator = (strField, maxLength) =>
    '(' + emojiCount(strField) + '/' + maxLength + ')'



export const emojiClueSchema = () => Yup.string()
    .test(
        "only-emojis",
        "Only emojis are allowed!",
        (str) => onlyEmojis(str)
    )
    .test(
        "emoji-count",
        `There must be at least ${EMOJI_CLUE_MIN_LENGTH} and at most ${EMOJI_CLUE_MAX_LENGTH} emojis`,
        (str) => {
            const numEmojis = emojiCount(str);
            return EMOJI_CLUE_MIN_LENGTH <= numEmojis && numEmojis <= EMOJI_CLUE_MAX_LENGTH;
        }
    )
    .required("Required.")


export default function SubmitEmojiQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const fileRef = useRef(null);

    const [submitEmojiQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
        try {
            const image = getFileFromRef(fileRef);

            const { topic, lang, ...details } = values;
            const { title, clue, answer_title } = details;
            const questionId = await submitQuestion(
                {
                    details: {
                        title,
                        clue,
                        answer: { title: answer_title }
                    },
                    type: QUESTION_TYPE,
                    topic,
                    // subtopics,,
                    lang,
                }, 
                userId,
                {
                    image: image
                }
            );

            if (props.inGameEditor) {
                await addQuestionToRound(props.gameId, props.roundId, questionId, userId);
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    })

    const validationSchema = Yup.object({
        lang: localeSchema(),
        topic: topicSchema(),
        title: stringSchema(EmojiQuestion.TITLE_MAX_LENGTH),
        answer_title: stringSchema(EmojiQuestion.ANSWER_TITLE_MAX_LENGTH),
        clue: emojiClueSchema(),
        files: imageFileSchema(fileRef, false),
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
                    maxLength={EmojiQuestion.TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label={QUESTION_ANSWER_LABEL[lang]}
                    name='answer_title'
                    type='text'
                    placeholder={EMOJI_ANSWER_TITLE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={EmojiQuestion.ANSWER_TITLE_MAX_LENGTH}
                />

                <MyTextInput
                    label="Emojis"
                    name='clue'
                    type='text'
                    placeholder={EMOJI_CLUE_EXAMPLE}
                    validationSchema={validationSchema}
                    maxLength={EmojiQuestion.CLUE_MAX_LENGTH}
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
