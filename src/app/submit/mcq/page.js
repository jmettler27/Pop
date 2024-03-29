'use client'

import React from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect, StyledErrorMessage } from '@/app/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/app/components/forms/MultiStepComponents';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';
import {
    MCQ_CHOICES, MCQ_CHOICES_EXAMPLE, MCQ_CHOICE_MAX_LENGTH, MCQ_NUMBER_OF_CHOICES,
    MCQ_EXPLANATION_EXAMPLE, MCQ_EXPLANATION_MAX_LENGTH,
    MCQ_NOTE_EXAMPLE, MCQ_NOTE_MAX_LENGTH,
    MCQ_SOURCE_EXAMPLE, MCQ_SOURCE_MAX_LENGTH,
    MCQ_TITLE_EXAMPLE, MCQ_TITLE_MAX_LENGTH
} from '@/lib/utils/question/mcq';

import Box from '@mui/system/Box';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';

const QUESTION_TYPE = 'mcq'


export default function Page({ params }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} />
            <SubmitMCQForm userId={session.user.id} inSubmitPage={true} />
        </>
    );
}


export function SubmitMCQForm({ userId, ...props }) {
    const router = useRouter()

    const [submitMCQ, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values
            const questionId = await addNewQuestion({
                details: { ...details },
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
                source: '',
                title: '',
                note: '',
                explanation: '',
                choices: Array(MCQ_NUMBER_OF_CHOICES).fill(''),
                answerIdx: -1,
                duoIdx: -1,
                // imageFiles: '',
                // audioFiles: ''
            }}
            onSubmit={async values => {
                await submitMCQ(values)
                if (props.inSubmitPage) {
                    router.push('/submit')
                } else if (props.inGameEditor) {
                    props.onDialogClose()
                }
            }}
            isSubmitting={isSubmitting}
        >

            <GeneralInfoStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    lang: localeSchema(),
                    topic: topicSchema(),
                    source: stringSchema(MCQ_SOURCE_MAX_LENGTH, false),
                    title: stringSchema(MCQ_TITLE_MAX_LENGTH),
                    note: stringSchema(MCQ_NOTE_MAX_LENGTH, false),
                })}
            />

            <EnterChoicesStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    choices: Yup.array()
                        .of(stringSchema(MCQ_CHOICE_MAX_LENGTH))
                        .length(MCQ_NUMBER_OF_CHOICES, `There must be exactly ${MCQ_NUMBER_OF_CHOICES} choices`)
                        .required("Required."),
                    answerIdx: Yup.number()
                        .min(0, "Required.")
                        .max(MCQ_NUMBER_OF_CHOICES - 1, "Required.")
                        .required("Required."),
                    explanation: stringSchema(MCQ_EXPLANATION_MAX_LENGTH, false),
                    duoIdx: Yup.number()
                        .min(0, "Required.")
                        .max(MCQ_NUMBER_OF_CHOICES - 1, "Required.")
                        .required("Required."),
                    // .test(
                    //     "same-as-answer",
                    //     "Must be different that the answer",
                    //     () => {
                    //         return this.parent.answerIdx !== this.parent.duoIdx
                    //     })
                })}
            >
                {/* TODO */}
            </EnterChoicesStep>
        </Wizard>
    )
}

function GeneralInfoStep({ onSubmit, validationSchema }) {
    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >

            <SelectLanguage lang='en' name='lang' validationSchema={validationSchema} />

            <SelectQuestionTopic lang='en' name='topic' validationSchema={validationSchema} />

            <MyTextInput
                // label={`${stringRequiredAsterisk(validationSchema, 'source')}To what work is this question related to? ${numCharsIndicator(values['source'], MCQ_SOURCE_MAX_LENGTH)}`}
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

        </WizardStep>
    )
}


function EnterChoicesStep({ onSubmit, validationSchema }) {
    const formik = useFormikContext();

    const values = formik.values
    const errors = formik.errors

    const ChoiceArrayErrors = () =>
        typeof errors.choices === 'string' && (
            <StyledErrorMessage>{errors.choices}</StyledErrorMessage>
        )

    const ChoiceError = ({ index }) => {
        const [field, meta] = useField(`choices.${index}`);
        return (typeof errors.choices === 'object' && meta.touched && meta.error) && (
            <StyledErrorMessage>{meta.error}</StyledErrorMessage>
        )
    }

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <FieldArray name='choices'>
                {({ }) => (
                    <Box component='section' sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
                        {values.choices.map((_item, index) => (
                            <div key={index}>
                                <label htmlFor={`choices.${index}`}>{MCQ_CHOICES[index]} ({values.choices[index].length}/{MCQ_CHOICE_MAX_LENGTH})</label>
                                <Field
                                    name={`choices.${index}`}
                                    type='text'
                                    placeholder={MCQ_CHOICES_EXAMPLE[index]}
                                />
                                <ChoiceError index={index} />
                            </div>
                        ))}
                    </Box>
                )}
            </FieldArray>
            <ChoiceArrayErrors />

            <MySelect
                label="What proposal is the correct one?"
                name='answerIdx'
                validationSchema={validationSchema}
                onChange={(e) => formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))}
            >
                <option value="">Select the answer</option>
                {values.choices.map((choice, index) => (
                    <option key={index} value={index}>{MCQ_CHOICES[index]}. {choice}</option>
                ))}
            </MySelect>

            <MyTextInput
                label="Give an explanation"
                name='explanation'
                type='text'
                placeholder={MCQ_EXPLANATION_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={MCQ_EXPLANATION_MAX_LENGTH}
            />

            {values.answerIdx >= 0 &&
                <MySelect
                    label="What other proposal do you want for the duo?"
                    name='duoIdx'
                    validationSchema={validationSchema}
                    onChange={(e) => formik.setFieldValue('duoIdx', parseInt(e.target.value, 10))}
                >
                    <option value="">Select the proposal</option>
                    {values.choices.map((choice, index) => (index !== values.answerIdx &&
                        <option key={index} value={index}>{MCQ_CHOICES[index]}. {choice}</option>
                    ))}
                </MySelect>
            }

        </WizardStep>
    )
}