'use client'

import React, { useRef } from 'react';
import { Field, FieldArray, Form, Formik, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, StyledErrorMessage } from '@/app/components/forms/StyledFormComponents'
import { UploadImage } from '@/app/components/forms/UploadFile';
import SubmitFormButton from '@/app/components/forms/SubmitFormButton';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';
import SelectLanguage from '@/app/submit/components/SelectLanguage';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/lib/utils/forms';
import { getFileFromRef, imageFileSchema } from '@/lib/utils/files';
import { useAsyncAction } from '@/lib/utils/async';
import { ADD_ITEM, QUESTION_ITEM, QUESTION_TITLE_LABEL, SUBMIT_QUESTION_BUTTON_LABEL } from '@/lib/utils/submit';
import { LABEL_MAX_LENGTH, LABEL_MAX_NUMBER_OF_LABELS, LABEL_MIN_NUMBER_OF_LABELS, LABEL_TITLE_MAX_LENGTH, LABEL_TITLE_EXAMPLE, LABEL_EXAMPLE } from '@/lib/utils/question/label';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { updateQuestionImage } from '@/lib/firebase/storage';
import { serverTimestamp } from 'firebase/firestore';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';

const QUESTION_TYPE = 'label'

const labelsSchema = () => Yup.array()
    .of(stringSchema(LABEL_MAX_LENGTH))
    .min(LABEL_MIN_NUMBER_OF_LABELS, `There must be at least ${LABEL_MIN_NUMBER_OF_LABELS} labels`)
    .max(LABEL_MAX_NUMBER_OF_LABELS, `There can be at most ${LABEL_MAX_NUMBER_OF_LABELS} labels`)



export default function Page({ }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} />
            <SubmitLabelQuestionForm userId={session.user.id} inSubmitPage={true} />
        </>
    )
}

export function SubmitLabelQuestionForm({ userId, lang = DEFAULT_LOCALE, ...props }) {
    const router = useRouter()

    const [submitImageQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
        try {
            // await handleImageFormSubmission(values, session.user.id, fileRef)
            const image = getFileFromRef(fileRef);
            if (!image) {
                throw new Error("No image file");
            }
            const { files, topic, lang, ...details } = values;
            const { title, labels } = details;

            const questionId = await addNewQuestion({
                details: {
                    title,
                    labels,
                },
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
        title: stringSchema(LABEL_TITLE_MAX_LENGTH),
        files: imageFileSchema(fileRef, true),
        labels: labelsSchema(),
    })

    return (
        <Formik
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                title: '',
                files: '',
                labels: Array(LABEL_MIN_NUMBER_OF_LABELS).fill(''),
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
                    placeholder={LABEL_TITLE_EXAMPLE[lang]}
                    validationSchema={validationSchema}
                    maxLength={LABEL_TITLE_MAX_LENGTH}
                />

                <UploadImage fileRef={fileRef} name='files' validationSchema={validationSchema} lang={lang} />

                <EnterLabels lang={lang} validationSchema={validationSchema} />


                <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_QUESTION_BUTTON_LABEL[lang]} />
            </Form>
        </Formik >
    );

}

function EnterLabels({ validationSchema, lang }) {
    const formik = useFormikContext();

    const values = formik.values
    const errors = formik.errors

    const ItemArrayErrors = () =>
        typeof errors.labels === 'string' && <StyledErrorMessage>{errors.labels}</StyledErrorMessage>

    const ItemError = ({ index }) => {
        const [_, meta] = useField('labels.' + index);
        return typeof errors.labels === 'object' && meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    }

    return (
        <>
            <p>{NUM_LABELS_ALLOWED[lang]}: {LABEL_MIN_NUMBER_OF_LABELS}-{LABEL_MAX_NUMBER_OF_LABELS}.</p>

            <FieldArray name='labels'>
                {({ remove, push }) => (
                    <div>
                        {values.labels.length > 0 &&
                            values.labels.map((item, index) => (
                                <Box key={index} component='section' sx={{ my: 2, pb: 2, px: 2, border: '2px dashed grey', width: '500px' }}>
                                    <label htmlFor={'labels.' + index}>{requiredStringInArrayFieldIndicator(validationSchema, 'labels')}{QUESTION_ITEM[lang]} #{index + 1} {numCharsIndicator(item, LABEL_MAX_LENGTH)}</label>
                                    <Field
                                        name={'labels.' + index}
                                        type='text'
                                        placeholder={LABEL_EXAMPLE[index % LABEL_EXAMPLE.length]}
                                    />
                                    <IconButton
                                        color='error'
                                        onClick={() => remove(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                    <ItemError index={index} />

                                </Box>
                            ))}
                        <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={() => push('')}
                        >
                            {ADD_ITEM[lang]}
                        </Button>
                    </div>
                )}
            </FieldArray>

            <ItemArrayErrors />
        </>
    )
}

const NUM_LABELS_ALLOWED = {
    'en': "Number of labels allowed",
    'fr-FR': "Nombre d'étiquettes autorisé",
}
