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
    MCQ_CHOICES, MCQ_CHOICES_EXAMPLE, MCQ_CHOICE_MAX_LENGTH, MCQ_NUMBER_OF_CHOICES,
    MCQ_EXPLANATION_EXAMPLE, MCQ_EXPLANATION_MAX_LENGTH,
    MCQ_NOTE_EXAMPLE, MCQ_NOTE_MAX_LENGTH,
    MCQ_SOURCE_EXAMPLE, MCQ_SOURCE_MAX_LENGTH,
    MCQ_TITLE_EXAMPLE, MCQ_TITLE_MAX_LENGTH,
    mcqSubtypeSchema,
    MCQ_TYPE_TO_TITLE,
    MCQ_TYPE_TO_EMOJI,
    MCQ_MIN_NUMBER_OF_CHOICES,
    MCQ_MAX_NUMBER_OF_CHOICES,
} from '@/lib/utils/question/mcq';

import Box from '@mui/system/Box';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
import { QUESTION_EXPLANATION_LABEL, QUESTION_HINTS_REMARKS, QUESTION_SOURCE_LABEL, QUESTION_TITLE_LABEL, SELECT_PROPOSAL } from '@/lib/utils/submit';

const QUESTION_TYPE = 'mcq'


export default function Page({ lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitMCQForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    );
}


export function SubmitMCQForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitMCQ, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, duoIdx, ...rest } = values
            const details = values.subtype === 'immediate' ? rest : { duoIdx, ...rest };
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
                subtype: '',
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
                    subtype: mcqSubtypeSchema(),
                    source: stringSchema(MCQ_SOURCE_MAX_LENGTH, false),
                    title: stringSchema(MCQ_TITLE_MAX_LENGTH),
                    note: stringSchema(MCQ_NOTE_MAX_LENGTH, false),
                })}
                lang={lang}
            />

            <EnterChoicesStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    choices: Yup.array()
                        .of(stringSchema(MCQ_CHOICE_MAX_LENGTH))
                        .min(MCQ_MIN_NUMBER_OF_CHOICES, `There must be at least ${MCQ_MIN_NUMBER_OF_CHOICES} choices`)
                        .max(MCQ_MAX_NUMBER_OF_CHOICES, `There must be at most ${MCQ_MAX_NUMBER_OF_CHOICES} choices`),
                    // .length(MCQ_NUMBER_OF_CHOICES, `There must be exactly ${MCQ_NUMBER_OF_CHOICES} choices`)
                    // .required("Required."),
                    answerIdx: Yup.number()
                        .min(0, "Required.")
                        .max(MCQ_NUMBER_OF_CHOICES - 1, "Required.")
                        .required("Required."),
                    explanation: stringSchema(MCQ_EXPLANATION_MAX_LENGTH, false),
                    duoIdx: Yup.number()
                        .when('subtype', {
                            is: 'conditional',
                            then: (schema) => schema.min(0, "Required.").max(MCQ_NUMBER_OF_CHOICES - 1, "Required.").required("Required."),
                            otherwise: (schema) => schema.notRequired()
                        })
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

            <MySelect
                label={MCQ_TYPE[lang]}
                name='subtype'
                validationSchema={validationSchema}
            >
                <option value="">{SELECT_MCQ_TYPE[lang]}</option>
                {Object.entries(MCQ_TYPE_TO_TITLE[lang]).map(([subtype, title]) => (
                    <option key={subtype} value={subtype}>{MCQ_TYPE_TO_EMOJI[subtype]} {title}</option>
                ))}
            </MySelect>

            <MyTextInput
                // label={`${stringRequiredAsterisk(validationSchema, 'source')}To what work is this question related to? ${numCharsIndicator(values['source'], MCQ_SOURCE_MAX_LENGTH)}`}
                label={QUESTION_SOURCE_LABEL[lang]}
                name='source'
                type='text'
                placeholder={MCQ_SOURCE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQ_SOURCE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_TITLE_LABEL[lang]}
                name='title'
                type='text'
                placeholder={MCQ_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQ_TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_HINTS_REMARKS[lang]}
                name='note'
                type='text'
                placeholder={MCQ_NOTE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQ_NOTE_MAX_LENGTH}
            />

        </WizardStep>
    )
}

const MCQ_TYPE = {
    'en': "Type of the MCQ",
    'fr-FR': "Type de QCM",
}

const SELECT_MCQ_TYPE = {
    'en': "Select the type",
    'fr-FR': "Sélectionnez le type",
}

import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { IconButton } from '@mui/material';


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
                {({ remove, push }) => (
                    <div>
                        {values.choices.map((clue, index) => (
                            <div className='row' key={index}>
                                <label htmlFor={`choices.${index}`}>{MCQ_CHOICES[index]} ({values.choices[index].length}/{MCQ_CHOICE_MAX_LENGTH})</label>
                                <Field
                                    name={'choices.' + index}
                                    placeholder={MCQ_CHOICES_EXAMPLE[index]}
                                    type='text'
                                />
                                <ChoiceError index={index} />

                                <IconButton
                                    color='error'
                                    onClick={() => remove(index)}
                                >
                                    <DeleteIcon />
                                </IconButton>

                                <ChoiceError index={index} />

                            </div>
                        ))}
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => push('')}
                        >
                            {ADD_CHOICE[lang]}
                        </Button>

                    </div>

                    // <Box component='section' sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
                    //     {values.choices.map((_item, index) => (
                    //         <div key={index}>
                    //             <label htmlFor={`choices.${index}`}>{MCQ_CHOICES[index]} ({values.choices[index].length}/{MCQ_CHOICE_MAX_LENGTH})</label>
                    //             <Field
                    //                 name={`choices.${index}`}
                    //                 type='text'
                    //                 placeholder={MCQ_CHOICES_EXAMPLE[index]}
                    //             />
                    //             <ChoiceError index={index} />
                    //         </div>
                    //     ))}
                    // </Box>
                )}
            </FieldArray>
            <ChoiceArrayErrors />

            <MySelect
                label={MCQ_ANSWER_IDX_LABEL[lang]}
                name='answerIdx'
                validationSchema={validationSchema}
                onChange={(e) => formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))}
            >
                <option value="">{SELECT_PROPOSAL[lang]}</option>
                {values.choices.map((choice, index) => (
                    <option key={index} value={index}>{MCQ_CHOICES[index]}. {choice}</option>
                ))}
            </MySelect>

            <MyTextInput
                label={QUESTION_EXPLANATION_LABEL[lang]}
                name='explanation'
                type='text'
                placeholder={MCQ_EXPLANATION_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQ_EXPLANATION_MAX_LENGTH}
            />

            {values.subtype === 'conditional' && values.answerIdx >= 0 &&
                <MySelect
                    label={MCQ_DUO_IDX_LABEL[lang]}
                    name='duoIdx'
                    validationSchema={validationSchema}
                    onChange={(e) => formik.setFieldValue('duoIdx', parseInt(e.target.value, 10))}
                >
                    <option value="">{SELECT_PROPOSAL[lang]}</option>
                    {values.choices.map((choice, index) => (index !== values.answerIdx &&
                        <option key={index} value={index}>{MCQ_CHOICES[index]}. {choice}</option>
                    ))}
                </MySelect>
            }

        </WizardStep>
    )
}

const ADD_CHOICE = {
    'en': "Add choice",
    'fr-FR': "Ajouter choix"
}

const MCQ_ANSWER_IDX_LABEL = {
    'en': "What proposal is the correct one ?",
    'fr-FR': "Quelle proposition est la bonne?"
}

const MCQ_DUO_IDX_LABEL = {
    'en': "What other proposal do you want for the duo?",
    'fr-FR': "Quelle autre proposition voulez-vous pour le duo ?"
}
