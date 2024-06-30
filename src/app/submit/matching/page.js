'use client'

import React, { Fragment } from 'react';
import { FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect, StyledErrorMessage, MyNumberInput } from '@/app/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/app/components/forms/MultiStepComponents';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';

import {
    MATCHING_TITLE_MAX_LENGTH, MATCHING_TITLE_EXAMPLE,
    MATCHING_MAX_NUM_COLS, MATCHING_MIN_NUM_COLS,
    MATCHING_MIN_NUM_ROWS, MATCHING_MAX_NUM_ROWS,
    MATCHING_ITEM_MAX_LENGTH, MATCHING_ANSWER_EXAMPLE_2, MATCHING_ANSWER_EXAMPLE_3
} from '@/lib/utils/question/matching';

const QUESTION_TYPE = 'matching'

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
import { QUESTION_ITEM, QUESTION_TITLE_LABEL } from '@/lib/utils/submit';

export default function Page({ lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitMatchingQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    )
}

export function SubmitMatchingQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitMatchingQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values
            const { matches, title, numCols } = details
            const numRows = matches.length

            const answer = matches.reduce((acc, row, index) => {
                acc[index] = row;
                return acc;
            }, {})

            const questionId = await addNewQuestion({
                details: { answer, title, numCols, numRows },
                type: QUESTION_TYPE,
                topic,
                // subtopics: subtopics
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
                numCols: MATCHING_MIN_NUM_COLS,
                matches: []
            }}
            onSubmit={async values => {
                await submitMatchingQuestion(values)
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
                    title: stringSchema(MATCHING_TITLE_MAX_LENGTH),
                    numCols: Yup.number()
                        .min(MATCHING_MIN_NUM_COLS, `Must be between ${MATCHING_MIN_NUM_COLS} and ${MATCHING_MAX_NUM_COLS}`)
                        .max(MATCHING_MAX_NUM_COLS, `Must be between ${MATCHING_MIN_NUM_COLS} and ${MATCHING_MAX_NUM_COLS}`)
                        .required("Required."),
                })}
                lang={lang}
            />

            {/* Step 2: Proposals */}
            <EnterMatchesStep
                onSubmit={() => { }}
                lang={lang}
            />
        </Wizard>
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
                placeholder={MATCHING_TITLE_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={MATCHING_TITLE_MAX_LENGTH}
            />

            {/* <br />
            <br /> */}
            <MyNumberInput
                label={NUM_COLUMNS[lang]}
                name='numCols'
                min={MATCHING_MIN_NUM_COLS} max={MATCHING_MAX_NUM_COLS}
            // validationSchema={validationSchema}
            />

        </WizardStep>
    )
}

const NUM_COLUMNS = {
    'en': "Number of columns",
    'fr-FR': "Nombre de colonnes"
}


const matchingItemsSchema = (numCols) => {
    // let row = []
    // for (let col = 0; col < numCols; col++) {
    //     row[col] = stringSchema(MATCHING_ITEM_MAX_LENGTH)
    // }
    return Yup.array()
        .of(Yup.array()
            .of(stringSchema(MATCHING_ITEM_MAX_LENGTH))
            .length(numCols)
        )
        .min(MATCHING_MIN_NUM_ROWS, `There must be at least ${MATCHING_MIN_NUM_ROWS} matches.`)
        .max(MATCHING_MAX_NUM_ROWS, `There can be at most ${MATCHING_MAX_NUM_ROWS} matches.`)
}

// Array.from({ length: numCols }, (_, i) => [i, '']).reduce((acc, [key, value]) => {
// acc[key] = value;
// return acc;
// }, {})

function EnterMatchesStep({ onSubmit, lang }) {
    const formik = useFormikContext();

    const values = formik.values
    const errors = formik.errors

    const MatchArrayErrors = () =>
        typeof errors.matches === 'string' && <StyledErrorMessage>{errors.matches}</StyledErrorMessage>

    const MatchItemError = ({ col, row }) => {
        return typeof errors.matches === 'array' && errors.matches[row][col] && <StyledErrorMessage>{errors.matches[row][col]}</StyledErrorMessage>
    }

    console.log("==============================================================")

    const matches = values.matches
    console.log("Matches:", matches)
    console.log("Errors:", errors)

    const validationSchema = Yup.object({
        matches: matchingItemsSchema(values.numCols)
    })
    console.log("Validation schema", validationSchema)

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <p>{NUM_MATCHES_ALLOWED[lang]}: {MATCHING_MIN_NUM_ROWS}-{MATCHING_MAX_NUM_ROWS}. </p>

            <FieldArray name='matches'>
                {({ remove, push }) => (
                    <>
                        {matches.length > 0 &&
                            matches.map((match, row) => (
                                <Box key={row} component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
                                    <span className='text-lg'>Match #{row + 1}</span>

                                    <IconButton
                                        color='error'
                                        onClick={() => remove(row)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                    {Array(values.numCols).fill(0).map((_, col) => (
                                        <Fragment key={`${row}_${col}`}>
                                            <MyTextInput
                                                label={`${QUESTION_ITEM[lang]} #${col + 1}`}
                                                name={`matches.${row}.${col}`}
                                                type='text'
                                                placeholder={itemPlaceholder(col, row, values.numCols)}
                                                validationSchema={validationSchema}
                                                maxLength={MATCHING_ITEM_MAX_LENGTH}
                                            />
                                            <MatchItemError col={col} row={row} />
                                        </Fragment>
                                    ))}

                                </Box>
                            ))}
                        <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={() => push(Array.from({ length: values.numCols }, () => ''))}
                        >
                            {ADD_MATCH[lang]}
                        </Button>
                    </>
                )}
            </FieldArray>

            <MatchArrayErrors />

        </WizardStep>
    )
}

const NUM_MATCHES_ALLOWED = {
    'en': "Number of matches allowed",
    'fr-FR': "Nombre de matchs autorisé"
}


const ADD_MATCH = {
    'en': "Add match",
    'fr-FR': "Ajouter match"
}

const itemPlaceholder = (col, row, numCols) => {
    if (numCols === 2)
        return MATCHING_ANSWER_EXAMPLE_2[row % MATCHING_ANSWER_EXAMPLE_2.length][col]
    if (numCols === 3)
        return MATCHING_ANSWER_EXAMPLE_3[row % MATCHING_ANSWER_EXAMPLE_3.length][col]
    return `${QUESTION_ITEM[lang]} #${col + 1} of Matching #${row + 1}`
}