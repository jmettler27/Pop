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
import { requiredStringInArrayFieldIndicator, stringSchema } from '@/lib/utils/forms';
import {
    NAGUI_CHOICES, NAGUI_CHOICES_EXAMPLE, NAGUI_CHOICE_MAX_LENGTH, NAGUI_NUMBER_OF_CHOICES,
    NAGUI_EXPLANATION_EXAMPLE, NAGUI_EXPLANATION_MAX_LENGTH,
    NAGUI_NOTE_EXAMPLE, NAGUI_NOTE_MAX_LENGTH,
    NAGUI_SOURCE_EXAMPLE, NAGUI_SOURCE_MAX_LENGTH,
    NAGUI_TITLE_EXAMPLE, NAGUI_TITLE_MAX_LENGTH,
} from '@/lib/utils/question/nagui';

import Box from '@mui/system/Box';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
import { QUESTION_EXPLANATION_LABEL, QUESTION_HINTS_REMARKS, QUESTION_SOURCE_LABEL, QUESTION_TITLE_LABEL, SELECT_PROPOSAL } from '@/lib/utils/submit';

const QUESTION_TYPE = 'nagui'


export default function Page({ lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitNaguiQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    );
}


export function SubmitNaguiQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitNaguiQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, duoIdx, ...rest } = values
            const details = { duoIdx, ...rest };
            const questionId = await addNewQuestion({
                details,
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
                choices: Array(NAGUI_NUMBER_OF_CHOICES).fill(''),
                answerIdx: -1,
                duoIdx: -1,
                // imageFiles: '',
                // audioFiles: ''
            }}
            onSubmit={async values => {
                await submitNaguiQuestion(values)
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
                    source: stringSchema(NAGUI_SOURCE_MAX_LENGTH, false),
                    title: stringSchema(NAGUI_TITLE_MAX_LENGTH),
                    note: stringSchema(NAGUI_NOTE_MAX_LENGTH, false),
                })}
                lang={lang}
            />

            <EnterChoicesStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    choices: Yup.array()
                        .of(stringSchema(NAGUI_CHOICE_MAX_LENGTH))
                        .length(NAGUI_NUMBER_OF_CHOICES, `There must be exactly ${NAGUI_NUMBER_OF_CHOICES} choices`)
                        .required("Required."),
                    answerIdx: Yup.number()
                        .min(0, "Required.")
                        .max(NAGUI_NUMBER_OF_CHOICES - 1, "Required.")
                        .required("Required."),
                    explanation: stringSchema(NAGUI_EXPLANATION_MAX_LENGTH, false),
                    duoIdx: Yup.number()
                        .min(0, "Required.")
                        .max(NAGUI_NUMBER_OF_CHOICES - 1, "Required.")
                        .required("Required.")
                    // .test(
                    //     "same-as-answer",
                    //     "Must be different that the answer",
                    //     () => {
                    //         return this.parent.answerIdx !== this.parent.duoIdx
                    //     })
                })}
                lang={lang}
            >
                {/* TODO */}
            </EnterChoicesStep>
        </Wizard>
    )
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
                // label={`${stringRequiredAsterisk(validationSchema, 'source')}To what work is this question related to? ${numCharsIndicator(values['source'], NAGUI_SOURCE_MAX_LENGTH)}`}
                label={QUESTION_SOURCE_LABEL[lang]}
                name='source'
                type='text'
                placeholder={NAGUI_SOURCE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={NAGUI_SOURCE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_TITLE_LABEL[lang]}
                name='title'
                type='text'
                placeholder={NAGUI_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={NAGUI_TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_HINTS_REMARKS[lang]}
                name='note'
                type='text'
                placeholder={NAGUI_NOTE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={NAGUI_NOTE_MAX_LENGTH}
            />

        </WizardStep>
    )
}

function EnterChoicesStep({ onSubmit, validationSchema, lang }) {
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
                <Box component='section' sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
                    {values.choices.map((_item, index) => (
                        <div key={index}>
                            <label htmlFor={`choices.${index}`}>{NAGUI_CHOICES[index]} ({values.choices[index].length}/{NAGUI_CHOICE_MAX_LENGTH})</label>
                            <Field
                                name={`choices.${index}`}
                                type='text'
                                placeholder={NAGUI_CHOICES_EXAMPLE[index]}
                            />
                            <ChoiceError index={index} />
                        </div>
                    ))}
                </Box>
            </FieldArray>
            <ChoiceArrayErrors />

            <MySelect
                label={NAGUI_ANSWER_IDX_LABEL[lang]}
                name='answerIdx'
                validationSchema={validationSchema}
                onChange={(e) => formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))}
            >
                <option value="">{SELECT_PROPOSAL[lang]}</option>
                {values.choices.map((choice, index) => (
                    <option key={index} value={index}>{NAGUI_CHOICES[index]}. {choice}</option>
                ))}
            </MySelect>

            <MyTextInput
                label={QUESTION_EXPLANATION_LABEL[lang]}
                name='explanation'
                type='text'
                placeholder={NAGUI_EXPLANATION_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={NAGUI_EXPLANATION_MAX_LENGTH}
            />

            {values.answerIdx >= 0 &&
                <MySelect
                    label={NAGUI_DUO_IDX_LABEL[lang]}
                    name='duoIdx'
                    validationSchema={validationSchema}
                    onChange={(e) => formik.setFieldValue('duoIdx', parseInt(e.target.value, 10))}
                >
                    <option value="">{SELECT_PROPOSAL[lang]}</option>
                    {values.choices.map((choice, index) => (index !== values.answerIdx &&
                        <option key={index} value={index}>{NAGUI_CHOICES[index]}. {choice}</option>
                    ))}
                </MySelect>
            }

        </WizardStep>
    )
}

const NAGUI_ANSWER_IDX_LABEL = {
    'en': "What proposal is the correct one ?",
    'fr-FR': "Quelle proposition est la bonne?"
}

const NAGUI_DUO_IDX_LABEL = {
    'en': "What other proposal do you want for the duo?",
    'fr-FR': "Quelle autre proposition voulez-vous pour le duo ?"
}
