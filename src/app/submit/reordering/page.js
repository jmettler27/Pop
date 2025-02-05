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
    REORDERING_TITLE_MAX_LENGTH, REORDERING_TITLE_EXAMPLE,
    REORDERING_NOTE_MAX_LENGTH, REORDERING_NOTE_EXAMPLE,
    REORDERING_ITEM_TITLE_MAX_LENGTH, REORDERING_ITEM_EXPLANATION_MAX_LENGTH,
    REORDERING_ITEMS_EXAMPLE, REORDERING_MIN_NUMBER_OF_ITEMS, REORDERING_MAX_NUMBER_OF_ITEMS
} from '@/lib/utils/question/reodering';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';
import { ADD_ITEM, QUESTION_HINTS_REMARKS, QUESTION_ITEM, QUESTION_TITLE_LABEL, SELECT_PROPOSAL } from '@/lib/utils/submit';

const QUESTION_TYPE = 'reordering'

export default function Page({ lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitReorderingQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    );
}

const reorderingItemsSchema = () => Yup.array()
    .of(Yup.object({
        title: stringSchema(REORDERING_ITEM_TITLE_MAX_LENGTH),
        explanation: stringSchema(REORDERING_ITEM_EXPLANATION_MAX_LENGTH, false),
    }))
    .min(REORDERING_MIN_NUMBER_OF_ITEMS, `There must be at least ${REORDERING_MIN_NUMBER_OF_ITEMS} items`)
    .max(REORDERING_MAX_NUMBER_OF_ITEMS, `There must be at most ${REORDERING_MAX_NUMBER_OF_ITEMS} items`)
// .required("Required.")


export function SubmitReorderingQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitReorderingQuestion, isSubmitting] = useAsyncAction(async (values) => {
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
                items: Array(REORDERING_MIN_NUMBER_OF_ITEMS).fill({ title: '', explanation: '' }),
            }}
            onSubmit={async values => {
                await submitReorderingQuestion(values)
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
                    title: stringSchema(REORDERING_TITLE_MAX_LENGTH),
                    note: stringSchema(REORDERING_NOTE_MAX_LENGTH, false),
                })}
                lang={lang}
            />

            {/* Step 2: Proposals */}
            <EnterItemsStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    items: reorderingItemsSchema(),
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
                placeholder={REORDERING_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={REORDERING_TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_HINTS_REMARKS[lang]}
                name='note'
                type='text'
                placeholder={REORDERING_NOTE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={REORDERING_NOTE_MAX_LENGTH}
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

    const exampleItems = REORDERING_ITEMS_EXAMPLE[lang]

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <p>{NUM_ITEMS_ALLOWED[lang]}: {REORDERING_MIN_NUMBER_OF_ITEMS}-{REORDERING_MAX_NUMBER_OF_ITEMS}.</p>

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
                                        maxLength={REORDERING_ITEM_TITLE_MAX_LENGTH}
                                        fieldType='object_in_array'
                                    />
                                    <TitleError index={idx} />

                                    <MyTextInput
                                        label={`${EXPLANATION[lang]} #${idx + 1}`}
                                        name={`items.${idx}.explanation`}
                                        type='text'
                                        placeholder={exampleItems[idx % exampleItems.length].explanation}
                                        validationSchema={validationSchema}
                                        maxLength={REORDERING_ITEM_EXPLANATION_MAX_LENGTH}
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

        </WizardStep>
    )
}

const NUM_ITEMS_ALLOWED = {
    'en': "Number of proposals allowed",
    'fr-FR': "Nombre de propositions autorisées"
}

const PROPOSAL = {
    'en': "Proposal",
    'fr-FR': "Proposition"
}

const EXPLANATION = {
    'en': "Explanation",
    'fr-FR': "Explication"
}
