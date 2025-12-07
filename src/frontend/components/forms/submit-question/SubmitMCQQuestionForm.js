import { QuestionType } from '@/backend/models/questions/QuestionType';
import { MCQQuestion } from '@/backend/models/questions/MCQ';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/game-editor/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { QUESTION_EXPLANATION_LABEL, QUESTION_HINTS_REMARKS, QUESTION_SOURCE_LABEL, QUESTION_TITLE_LABEL, SELECT_PROPOSAL } from '@/frontend/utils/forms/questions';


import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import { stringSchema } from '@/frontend/utils/forms/forms';


import { useRouter } from 'next/navigation'

import React from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect, StyledErrorMessage } from '@/frontend/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';


const QUESTION_TYPE = QuestionType.MCQ;

const MCQ_CHOICES_EXAMPLE = [
    "101",
    "303",
    "404",
    "506"
]

/* MCQ Details */
const MCQ_SOURCE_EXAMPLE = {
    'en': "The Matrix",
    'fr-FR': "Matrix"
}

const MCQ_TITLE_EXAMPLE = {
    'en': "What is Neo's room number?",
    'fr-FR': "Quel est le numéro de chambre de Neo ?"
}

const MCQ_NOTE_EXAMPLE = ""

const MCQ_EXPLANATION_EXAMPLE = {
    'en': "101 is an allusion to Neo's destiny as the One. 101 is also the number usually attributed to a course or manual for beginners in a particular field (in this case it represents the beginning of Neo's path to hacker enlightenment). It can also be seen as an allusion to the Room 101 of George Orwell's novel 'Nineteen Eighty-Four'. It is a torture chamber in the 'Ministry of Love' in which a prisoner is subjected to his or her own worst nightmare, fear or phobia.",
    'fr-FR': "101 est une allusion au destin de Neo en tant que l'Unique. 101 est également le nombre généralement attribué à un cours ou à un manuel destiné aux débutants dans un domaine particulier (dans ce cas, il représente le début du chemin de Neo vers l'illumination du pirate informatique). On peut également y voir une allusion à la salle 101 du roman '1984' de George Orwell. Il s'agit d'une chambre de torture du 'Ministère de l'Amour' dans laquelle un prisonnier est soumis à son pire cauchemar, à sa peur ou à sa phobie,"
}


export default function SubmitMCQForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitMCQ, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, duoIdx, ...rest } = values
            const details = rest;
            const questionId = await submitQuestion(
                {
                    details,
                    type: QUESTION_TYPE,
                    topic,
                    // subtopics,,
                    lang,
                },
                userId
            );
            if (props.inGameEditor) {
                await addQuestionToRound(props.gameId, props.roundId, questionId, userId)
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
                choices: Array(MCQQuestion.MAX_NUM_CHOICES).fill(''),
                answerIdx: -1,
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
                    source: stringSchema(MCQQuestion.SOURCE_MAX_LENGTH, false),
                    title: stringSchema(MCQQuestion.TITLE_MAX_LENGTH),
                    note: stringSchema(MCQQuestion.NOTE_MAX_LENGTH, false),
                })}
                lang={lang}
            />

            <EnterChoicesStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    choices: Yup.array()
                        .of(stringSchema(MCQQuestion.CHOICE_MAX_LENGTH))
                        .min(MCQQuestion.MIN_NUM_CHOICES, `There must be at least ${MCQQuestion.MIN_NUM_CHOICES} choices`)
                        .max(MCQQuestion.MAX_NUM_CHOICES, `There must be at most ${MCQQuestion.MAX_NUM_CHOICES} choices`),
                    answerIdx: Yup.number()
                        .min(0, "Required.")
                        .max(MCQQuestion.MAX_NUM_CHOICES - 1, "Required.")
                        .required("Required."),
                    explanation: stringSchema(MCQQuestion.EXPLANATION_MAX_LENGTH, false),
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
                // label={`${stringRequiredAsterisk(validationSchema, 'source')}To what work is this question related to? ${numCharsIndicator(values['source'], MCQ_SOURCE_MAX_LENGTH)}`}
                label={QUESTION_SOURCE_LABEL[lang]}
                name='source'
                type='text'
                placeholder={MCQ_SOURCE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQQuestion.SOURCE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_TITLE_LABEL[lang]}
                name='title'
                type='text'
                placeholder={MCQ_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQQuestion.TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_HINTS_REMARKS[lang]}
                name='note'
                type='text'
                placeholder={MCQ_NOTE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQQuestion.NOTE_MAX_LENGTH}
            />

        </WizardStep>
    )
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
                                <label htmlFor={`choices.${index}`}>{MCQQuestion.CHOICES[index]} ({values.choices[index].length}/{MCQQuestion.CHOICE_MAX_LENGTH})</label>
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
                    <option key={index} value={index}>{MCQQuestion.CHOICES[index]}. {choice}</option>
                ))}
            </MySelect>

            <MyTextInput
                label={QUESTION_EXPLANATION_LABEL[lang]}
                name='explanation'
                type='text'
                placeholder={MCQ_EXPLANATION_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={MCQQuestion.EXPLANATION_MAX_LENGTH}
            />

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
