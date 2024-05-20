'use client'

import React, { useRef } from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, StyledErrorMessage } from '@/app/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/app/components/forms/MultiStepComponents';
import { UploadImage } from '@/app/components/forms/UploadFile';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/lib/utils/forms';
import { getFileFromRef, imageFileSchema } from '@/lib/utils/files';
import {
    PROGRESSIVE_CLUES_TITLE_EXAMPLE, PROGRESSIVE_CLUES_TITLE_MAX_LENGTH,
    PROGRESSIVE_CLUES_ANSWER_TITLE_EXAMPLE, PROGRESSIVE_CLUES_ANSWER_TITLE_MAX_LENGTH,
    PROGRESSIVE_CLUES_CLUES_EXAMPLE, PROGRESSIVE_CLUES_CLUE_MAX_LENGTH,
    PROGRESSIVE_CUES_MIN_NUMBER_OF_CLUES, PROGRESSIVE_CUES_MAX_NUMBER_OF_CLUES,
} from '@/lib/utils/question/progressive_clues';


import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import { IconButton } from '@mui/material';

import { addNewQuestion } from '@/lib/firebase/firestore';
import { updateQuestionImage } from '@/lib/firebase/storage';
import { serverTimestamp } from 'firebase/firestore';
import { handleProgressiveCluesFormSubmission } from '@/app/submit/actions';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';

const QUESTION_TYPE = "progressive_clues";

const progressiveCluesSchema = () => Yup.array()
    .of(Yup.string()
        .trim()
        .max(PROGRESSIVE_CLUES_CLUE_MAX_LENGTH, `Must be ${PROGRESSIVE_CLUES_CLUE_MAX_LENGTH} characters or less.`)
        .required("Required."))
    .min(PROGRESSIVE_CUES_MIN_NUMBER_OF_CLUES, `There must be at least ${PROGRESSIVE_CUES_MIN_NUMBER_OF_CLUES} clues.`)
    .max(PROGRESSIVE_CUES_MAX_NUMBER_OF_CLUES, `There can be at most ${PROGRESSIVE_CUES_MAX_NUMBER_OF_CLUES} clues.`)


export default function Page({ }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} />
            <SubmitProgressiveCluesQuestionForm userId={session.user.id} inSubmitPage={true} />
        </>
    );
}

export function SubmitProgressiveCluesQuestionForm({ userId, ...props }) {
    const router = useRouter()

    const [submitProgressiveCluesQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
        try {
            const image = getFileFromRef(fileRef);
            if (!image) {
                throw new Error("No image file");
            }
            const { files, topic, lang, ...details } = values;
            const { title, clues, answer_title } = details;
            const questionId = await addNewQuestion({
                details: {
                    title,
                    clues,
                    answer: {
                        title: answer_title
                    }
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

    const fileRef = useRef(null);

    return (
        <Wizard
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                title: '',
                answer_title: '',
                clues: [''],
                files: '',
            }}
            onSubmit={async values => {
                await submitProgressiveCluesQuestion(values, fileRef)
                if (props.inSubmitPage) {
                    router.push('/submit')
                } else if (props.inGameEditor) {
                    props.onDialogClose()
                }
            }}
            isSubmitting={isSubmitting}
        >
            {/* Step 1: General info */}
            <GeneralInfoStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    lang: localeSchema(),
                    topic: topicSchema(),
                    title: stringSchema(PROGRESSIVE_CLUES_TITLE_MAX_LENGTH),
                    answer_title: stringSchema(PROGRESSIVE_CLUES_ANSWER_TITLE_MAX_LENGTH),
                })}
            />

            {/* Step 2: clues */}
            <EnterCluesStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    clues: progressiveCluesSchema(),
                })}
            />

            {/* Step 3: image */}
            <SelectImageStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    files: imageFileSchema(fileRef),
                })}
                fileRef={fileRef}
            />
        </Wizard>
    )
}

function GeneralInfoStep({ onSubmit, validationSchema }) {
    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >

            <SelectLanguage lang='fr-FR' name='lang' validationSchema={validationSchema} />

            <SelectQuestionTopic lang='fr-FR' name='topic' validationSchema={validationSchema} />

            <MyTextInput
                label="What is the question?"
                name='title'
                type='text'
                placeholder={PROGRESSIVE_CLUES_TITLE_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={PROGRESSIVE_CLUES_TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label="What is the answer?"
                name='answer_title'
                type='text'
                placeholder={PROGRESSIVE_CLUES_ANSWER_TITLE_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={PROGRESSIVE_CLUES_ANSWER_TITLE_MAX_LENGTH}
            />
        </WizardStep>
    )
}

function EnterCluesStep({ onSubmit, validationSchema }) {
    const formik = useFormikContext();

    const values = formik.values
    const errors = formik.errors

    // https://formik.org/docs/api/fieldarray#fieldarray-validation-gotchas
    const ClueArrayErrors = () =>
        typeof errors.clues === 'string' && <StyledErrorMessage>{errors.clues}</StyledErrorMessage>
    const ClueError = ({ index }) => {
        const [_, meta] = useField('clues.' + index);
        return typeof errors.clues === 'object' && meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    }

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <p>This type of question typically comprises from {PROGRESSIVE_CUES_MIN_NUMBER_OF_CLUES} to {PROGRESSIVE_CUES_MAX_NUMBER_OF_CLUES} clues.</p>

            <FieldArray name='clues'>
                {({ insert, remove, push }) => (
                    <div>
                        {values.clues.length > 0 &&
                            values.clues.map((clue, index) => (
                                <div className='row' key={index}>
                                    <label htmlFor={'clues.' + index}>{requiredStringInArrayFieldIndicator(validationSchema, 'clues')}Clue #{index + 1} {numCharsIndicator(clue, PROGRESSIVE_CLUES_CLUE_MAX_LENGTH)}</label>
                                    <Field
                                        name={'clues.' + index}
                                        placeholder={index < PROGRESSIVE_CLUES_CLUES_EXAMPLE.length ? PROGRESSIVE_CLUES_CLUES_EXAMPLE[index] : 'Some clue'}
                                        type='text'
                                    />
                                    {/* <ClueTextField index={index} /> */}

                                    <IconButton
                                        color='error'
                                        onClick={() => remove(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                    <ClueError index={index} />

                                </div>
                            ))}
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => push('')}
                        >
                            New clue
                        </Button>

                    </div>
                )}
            </FieldArray>

            <ClueArrayErrors />

        </WizardStep>
    )
}

function ClueTextField({ index }) {

    const formik = useFormikContext();

    return (

        <TextField
            // fullWidth
            id={'clues.' + index}
            name={'clues.' + index}
            label={`Clue #${index + 1}`}
            placeholder={PROGRESSIVE_CLUES_CLUES_EXAMPLE[index]}
            multiline
            maxRows={4}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            // className='placeholder-red-500 text-base bg-[color:var(--gray-800)] text-[white] border-[color:var(--gray-700)] appearance-none px-2 py-[0.65rem] rounded-[10px] border-2 border-solid w-[400px]'
            sx={{
                width: '400px'
                // 'MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline css-1sqnrkk-MuiInputBase-input-MuiOutlinedInput-input'
            }}
        />
    )
}


function SelectImageStep({ onSubmit, validationSchema, fileRef }) {
    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <UploadImage fileRef={fileRef} name='files' validationSchema={validationSchema} />
        </WizardStep>
    )
}
