'use client'

import React from 'react';
import { FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect, StyledErrorMessage } from '@/app/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/app/components/forms/MultiStepComponents';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { serverTimestamp } from 'firebase/firestore';
import { addNewQuestion } from '@/lib/firebase/firestore';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';
import {
    OOO_TITLE_MAX_LENGTH, OOO_TITLE_EXAMPLE,
    OOO_NOTE_MAX_LENGTH, OOO_NOTE_EXAMPLE,
    OOO_ITEM_TITLE_MAX_LENGTH, OOO_ITEM_EXPLANATION_MAX_LENGTH,
    OOO_ITEMS_EXAMPLE, OOO_MIN_NUMBER_OF_ITEMS, OOO_MAX_NUMBER_OF_ITEMS
} from '@/lib/utils/question/odd_one_out';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
import { ADD_ITEM, QUESTION_HINTS_REMARKS, QUESTION_ITEM, QUESTION_TITLE_LABEL, SELECT_PROPOSAL } from '@/lib/utils/submit';

const QUESTION_TYPE = 'odd_one_out'

export default function Page({ lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitOOOQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    );
}

const oddOneOutItemsSchema = () => Yup.array()
    .of(Yup.object({
        title: stringSchema(OOO_ITEM_TITLE_MAX_LENGTH),
        explanation: stringSchema(OOO_ITEM_EXPLANATION_MAX_LENGTH)
    }))
    .min(OOO_MIN_NUMBER_OF_ITEMS, `There must be at least ${OOO_MIN_NUMBER_OF_ITEMS} items`)
    .max(OOO_MAX_NUMBER_OF_ITEMS, `There must be at most ${OOO_MAX_NUMBER_OF_ITEMS} items`)
    .required("Required.")


export function SubmitOOOQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitOOOQuestion, isSubmitting] = useAsyncAction(async (values) => {
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
                title: '',
                note: '',
                items: Array(OOO_MIN_NUMBER_OF_ITEMS).fill({ title: '', explanation: '' }),
                answerIdx: -1,
            }}
            onSubmit={async values => {
                await submitOOOQuestion(values)
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
                    title: stringSchema(OOO_TITLE_MAX_LENGTH),
                    note: stringSchema(OOO_NOTE_MAX_LENGTH, false),
                })}
                lang={lang}
            />

            {/* Step 2: Proposals */}
            <EnterItemsStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    items: oddOneOutItemsSchema(),
                    answerIdx: Yup.number()
                        .min(0, "Required.")
                        .max(OOO_MAX_NUMBER_OF_ITEMS - 1, "Required.")
                        .required("Required."),
                })}
                lang={lang}
            />
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
                label={QUESTION_TITLE_LABEL[lang]}
                name='title'
                type='text'
                placeholder={OOO_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={OOO_TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_HINTS_REMARKS[lang]}
                name='note'
                type='text'
                placeholder={OOO_NOTE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={OOO_NOTE_MAX_LENGTH}
            />

        </WizardStep>
    )
}

function EnterItemsStep({ onSubmit, validationSchema, lang }) {
    const formik = useFormikContext();

    const values = formik.values
    const errors = formik.errors

    const ItemArrayErrors = () =>
        typeof errors.items === 'string' && <StyledErrorMessage>{errors.items}</StyledErrorMessage>

    const TitleError = ({ index }) =>
        typeof errors.items === 'array' && errors.items[index] && <StyledErrorMessage>{errors.items[index].title}</StyledErrorMessage>

    const ExplanationError = ({ index }) =>
        typeof errors.items === 'array' && errors.items[index] && <StyledErrorMessage>{errors.items[index].explanation}</StyledErrorMessage>

    const exampleItems = OOO_ITEMS_EXAMPLE[lang]

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <p>{NUM_ITEMS_ALLOWED[lang]}: {OOO_MIN_NUMBER_OF_ITEMS}-{OOO_MAX_NUMBER_OF_ITEMS}.</p>

            <p>{ENTER_ITEMS[lang]}</p>

            <FieldArray name="items">
                {({ remove, push }) => (
                    <>
                        {values.items.length > 0 &&
                            values.items.map((item, idx) => (
                                <Box key={idx} component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
                                    <span className='text-lg'>{QUESTION_ITEM[lang]} #{idx + 1}</span>

                                    <IconButton
                                        color='error'
                                        onClick={() => remove(idx)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                    <MyTextInput
                                        label={`${PROPOSAL[lang]} #${idx + 1}`}
                                        name={`items.${idx}.title`}
                                        type='text'
                                        placeholder={exampleItems[idx % exampleItems.length].title}
                                        validationSchema={validationSchema}
                                        maxLength={OOO_ITEM_TITLE_MAX_LENGTH}
                                        fieldType='object_in_array'
                                    />
                                    <TitleError index={idx} />

                                    <MyTextInput
                                        label={`${EXPLANATION[lang]} #${idx + 1}`}
                                        name={`items.${idx}.explanation`}
                                        type='text'
                                        placeholder={exampleItems[idx % exampleItems.length].explanation}
                                        validationSchema={validationSchema}
                                        maxLength={OOO_ITEM_EXPLANATION_MAX_LENGTH}
                                        fieldType='object_in_array'
                                    />
                                    <ExplanationError index={idx} />


                                </Box>
                            ))}
                        <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={() => push({ title: '', explanation: '' })}
                        >
                            {ADD_ITEM[lang]}
                        </Button>
                    </>
                )}
            </FieldArray>

            <ItemArrayErrors />

            {!errors.items && formik.touched.items && (
                <MySelect
                    label={ANSWER_IDX_LABEL[lang]}
                    name='answerIdx'
                    validationSchema={validationSchema}
                    onChange={(e) => formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))}
                >
                    <option value="">{SELECT_PROPOSAL[lang]}</option>
                    {values.items.map((item, index) => (
                        <option key={index} value={index}>{item.title}</option>
                    ))}

                </MySelect>
            )}

        </WizardStep>
    )
}

const NUM_ITEMS_ALLOWED = {
    'en': "Number of proposals allowed",
    'fr-FR': "Nombre de propositions autorisées"
}

const ENTER_ITEMS = {
    'en': "All the proposals must be correct, except for one (the odd one out).",
    'fr-FR': "Toutes les propositions doivent être correctes, sauf une (l'intrus)."
}

const PROPOSAL = {
    'en': "Proposal",
    'fr-FR': "Proposition"
}

const EXPLANATION = {
    'en': "Explanation",
    'fr-FR': "Explication"
}


const ANSWER_IDX_LABEL = {
    'en': "What proposal is the odd one?",
    'fr-FR': "Qui est l'intrus ?"
}
