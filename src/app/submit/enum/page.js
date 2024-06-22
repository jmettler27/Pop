'use client'

import React from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, StyledErrorMessage, MyNumberInput, MyRadioGroup } from '@/app/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/app/components/forms/MultiStepComponents';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { numCharsIndicator, requiredFieldIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/lib/utils/forms';
import { ENUM_ANSWER_EXAMPLE, ENUM_ANSWER_ITEM_MAX_LENGTH, ENUM_MAX_NUMBER_OF_ANSWERS, ENUM_MAX_THINKING_SECONDS, ENUM_MAX_CHALLENGE_SECONDS, ENUM_MIN_NUMBER_OF_ANSWERS, ENUM_MIN_THINKING_SECONDS, ENUM_MIN_CHALLENGE_SECONDS, ENUM_NOTE_EXAMPLE, ENUM_NOTE_MAX_LENGTH, ENUM_TITLE_MAX_LENGTH, ENUM_TITLE_EXAMPLE } from '@/lib/utils/question/enum';


const QUESTION_TYPE = 'enum'

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { serverTimestamp } from 'firebase/firestore';
import { addNewQuestion } from '@/lib/firebase/firestore';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
import { ADD_ITEM, QUESTION_HINTS_REMARKS, QUESTION_ITEM, QUESTION_TITLE_LABEL } from '@/lib/utils/submit';

const enumAnswerSchema = () => Yup.array()
    .of(stringSchema(ENUM_ANSWER_ITEM_MAX_LENGTH))
    .min(ENUM_MIN_NUMBER_OF_ANSWERS, `There must be at least ${ENUM_MIN_NUMBER_OF_ANSWERS} answers`)
    .max(ENUM_MAX_NUMBER_OF_ANSWERS, `There can be at most ${ENUM_MAX_NUMBER_OF_ANSWERS} answers`)


export default function Page({ lang = 'fr-FR' }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitEnumQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    )
}

export function SubmitEnumQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitEnumQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values;
            const { picked, ...rest } = details;
            const questionId = await addNewQuestion({
                details: { ...rest },
                type: QUESTION_TYPE,
                topic,
                // subtopics,,
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

    return (
        <Wizard
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                title: '',
                note: '',
                answer: [''],
                maxIsKnown: null,
                thinkingTime: 60,
                challengeTime: 60,
            }}
            onSubmit={async values => {
                await submitEnumQuestion(values)
                if (props.inSubmitPage)
                    router.push('/submit')
                else if (props.inGameEditor) {
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
                    title: stringSchema(ENUM_TITLE_MAX_LENGTH),
                    note: stringSchema(ENUM_NOTE_MAX_LENGTH, false),
                })}
                lang={lang}
            />


            {/* Step 2: answer */}
            <EnterAnswerItemsStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    answer: enumAnswerSchema(),
                    maxIsKnown: Yup.boolean().required("Required."),
                })}
                lang={lang}
            />

            {/* Step 3: Times */}
            <EnterTimesStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    thinkingTime: Yup.number()
                        .min(ENUM_MIN_THINKING_SECONDS, `Must be between ${ENUM_MIN_THINKING_SECONDS} and ${ENUM_MAX_THINKING_SECONDS} seconds`)
                        .max(ENUM_MAX_THINKING_SECONDS, `Must be between ${ENUM_MIN_THINKING_SECONDS} and ${ENUM_MAX_THINKING_SECONDS} seconds`)
                        .required("Required."),
                    challengeTime: Yup.number()
                        .min(ENUM_MIN_CHALLENGE_SECONDS, `Must be between ${ENUM_MIN_CHALLENGE_SECONDS} and ${ENUM_MAX_CHALLENGE_SECONDS} seconds`)
                        .max(ENUM_MAX_CHALLENGE_SECONDS, `Must be between ${ENUM_MIN_CHALLENGE_SECONDS} and ${ENUM_MAX_CHALLENGE_SECONDS} seconds`)
                        .required("Required."),
                })}
            />

        </Wizard >
    );
}

function GeneralInfoStep({ onSubmit, validationSchema, lang }) {
    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <SelectLanguage lang={lang} name='lang' validationSchema={validationSchema} />

            <SelectQuestionTopic lang={lang} name='topic' validationSchema={validationSchema} />

            <MyTextInput
                label={QUESTION_TITLE_LABEL[lang]}
                name='title'
                type='text'
                placeholder={ENUM_TITLE_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={ENUM_TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_HINTS_REMARKS[lang]}
                name='note'
                type='text'
                placeholder={ENUM_NOTE_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={ENUM_NOTE_MAX_LENGTH}
            />
        </WizardStep>
    )
}


function EnterAnswerItemsStep({ onSubmit, validationSchema, lang }) {
    const formik = useFormikContext();

    const values = formik.values
    const errors = formik.errors

    const ItemArrayErrors = () =>
        typeof errors.answer === 'string' && <StyledErrorMessage>{errors.answer}</StyledErrorMessage>

    const ItemError = ({ index }) => {
        const [_, meta] = useField('answer.' + index);
        return typeof errors.answer === 'object' && meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    }

    const MaxIsKnownError = () => {
        const [_, meta] = useField('maxIsKnown');
        return typeof errors.maxIsKnown === 'string' && meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    }

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <p>{NUM_ANSWERS_ALLOWED[lang]}: {ENUM_MIN_NUMBER_OF_ANSWERS}-{ENUM_MAX_NUMBER_OF_ANSWERS}.</p>

            <MyRadioGroup
                label="Do you know the maximum number of possible answers?"
                name='maxIsKnown'
                // options={[
                //     { value: true, label: 'Yes' },
                //     { value: false, label: 'No' },
                // ]}
                trueText='Yes'
                falseText='No'
                validationSchema={validationSchema}
            />

            <FieldArray name='answer'>
                {({ remove, push }) => (
                    <div>
                        {values.answer.length > 0 &&
                            values.answer.map((item, index) => (
                                <Box key={index} component='section' sx={{ my: 2, pb: 2, px: 2, border: '2px dashed grey', width: '500px' }}>
                                    <label htmlFor={'answer.' + index}>{requiredStringInArrayFieldIndicator(validationSchema, 'answer')}{QUESTION_ITEM[lang]} #{index + 1} {numCharsIndicator(item, ENUM_ANSWER_ITEM_MAX_LENGTH)}</label>
                                    <Field
                                        name={'answer.' + index}
                                        type='text'
                                        placeholder={ENUM_ANSWER_EXAMPLE[index % ENUM_ANSWER_EXAMPLE.length]}
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


        </WizardStep>
    )
}

const NUM_ANSWERS_ALLOWED = {
    'en': "Number of items allowed",
    'fr-FR': "Nombre d'items autorisé",
}


function EnterTimesStep({ onSubmit, validationSchema }) {
    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <MyNumberInput
                label="How many seconds should the user have to think and submit a bet?"
                name='thinkingTime'
                min={ENUM_MIN_THINKING_SECONDS} max={ENUM_MAX_THINKING_SECONDS}
            // validationSchema={validationSchema}
            />

            <MyNumberInput
                label="How many seconds should the challenger have to enumerate the items?"
                name='challengeTime'
                min={ENUM_MIN_CHALLENGE_SECONDS} max={ENUM_MAX_CHALLENGE_SECONDS}
            // validationSchema={validationSchema}
            />
        </WizardStep>
    )
}