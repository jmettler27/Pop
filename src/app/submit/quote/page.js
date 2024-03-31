'use client'

import React from 'react';
import { Field, FieldArray, useField, useFormikContext, move } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, StyledErrorMessage } from '@/app/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/app/components/forms/MultiStepComponents';
import SelectLanguage from '@/app/submit/components/SelectLanguage';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';

import {
    QUOTE_MAX_LENGTH, QUOTE_EXAMPLE,
    QUOTE_SOURCE_EXAMPLE, QUOTE_SOURCE_MAX_LENGTH,
    QUOTE_AUTHOR_EXAMPLE, QUOTE_AUTHOR_MAX_LENGTH,
    QUOTE_ELEMENTS,
    replaceAllNonSpace, replaceSubstrings
} from '@/lib/utils/question/quote';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

import { useAsyncAction } from '@/lib/utils/async';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game';

const QUESTION_TYPE = 'quote'


export default function Page({ }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} />
            <SubmitQuoteQuestionForm userId={session.user.id} inSubmitPage={true} />
        </>
    );
}

export function SubmitQuoteQuestionForm({ userId, ...props }) {
    const router = useRouter()

    const [submitQuoteQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values
            if (!(details.toGuess.includes('quote'))) {
                details.quoteParts = [];
            }
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
                quote: '',
                source: '',
                author: '',
                toGuess: [],
                quoteParts: [],
            }}
            onSubmit={async values => {
                await submitQuoteQuestion(values)
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
                    quote: stringSchema(QUOTE_MAX_LENGTH),
                    source: stringSchema(QUOTE_SOURCE_MAX_LENGTH),
                    author: stringSchema(QUOTE_AUTHOR_MAX_LENGTH)
                })}
            />

            {/* Step 2: indicate which aspects of the quote to guess */}
            <EnterGuessSteps
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    toGuess: Yup.array()
                        .of(Yup.string()
                            .oneOf(QUOTE_ELEMENTS, "Invalid guessable part.")
                            .required("Required."))
                        .min(1, "You must select at least one.")
                        .max(QUOTE_ELEMENTS.length, `You can select at most ${QUOTE_ELEMENTS.length}.`),
                    quoteParts: Yup.array()
                        .of(Yup.object({
                            startIdx: Yup.number()
                                .min(0, "Start index must be positive.")
                                .test(
                                    'start-idx-is-less-than-quote-end-idx',
                                    "Start index must be strictly less than the quote end index.",
                                    (value, context) => value < context.options.context.quote.length
                                )
                                .test(
                                    'start-idx-is-less-than-or-equal-to-end-index',
                                    "Start index must be less than or equal to the end index.",
                                    (value, context) => value <= context.parent.endIdx
                                )
                                .test(
                                    'start-idx-does-not-overlap',
                                    "Start index must not overlap with another part.",
                                    (value, context) => {
                                        // Overlap if startIdx is lower than a previous endIdx or higher than next startIdx
                                        const quoteParts = context.options.context.quoteParts;
                                        const startIdx = value
                                        const endIdx = context.parent.endIdx;
                                        return quoteParts.every(({ startIdx: otherStartIdx, endIdx: otherEndIdx }) => {
                                            return !(startIdx !== otherStartIdx && endIdx !== otherEndIdx) || (otherEndIdx < startIdx || endIdx < otherStartIdx)
                                        })
                                    }
                                )
                                .required("Required."),
                            endIdx: Yup.number()
                                .min(0, "End index must be positive.")
                                .test(
                                    'end-idx-is-less-than-quote-end-idx',
                                    "End index must be strictly less than the quote end index.",
                                    (value, context) => value < context.options.context.quote.length
                                )
                                .test(
                                    'end-idx-is-greater-than-or-equal-to-start-idx',
                                    "End index must be greater than or equal to the start index.",
                                    (value, context) => value >= context.parent.startIdx)
                                .test(
                                    'end-idx-does-not-overlap',
                                    "End index must not overlap with another part.",
                                    (value, context) => {
                                        const quoteParts = context.options.context.quoteParts;
                                        const startIdx = context.parent.startIdx;
                                        const endIdx = value;
                                        return quoteParts.every(({ startIdx: otherStartIdx, endIdx: otherEndIdx }) => {
                                            return !(startIdx !== otherStartIdx && endIdx !== otherEndIdx) || (otherEndIdx < startIdx || endIdx < otherStartIdx)
                                        })
                                    }
                                )
                                .required("Required.")
                        }))
                        .test(
                            'is-required-if-quote-parts-are-guessable',
                            "You must specify at least one part.",
                            (value, context) => !context.options.context.toGuess.includes('quote') || value.length > 0
                        )
                })}
            />
        </Wizard>
    )
}

function GeneralInfoStep({ onSubmit, validationSchema }) {
    const formik = useFormikContext();
    const values = formik.values;

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <SelectLanguage lang='en' name='lang' validationSchema={validationSchema} />

            <SelectQuestionTopic lang='en' name='topic' validationSchema={validationSchema} />

            <MyTextInput
                label="What is the quote?"
                name='quote'
                type='text'
                placeholder={QUOTE_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={QUOTE_MAX_LENGTH}
            />

            <MyTextInput
                label="Where does this quote come from?"
                name='source'
                type='text'
                placeholder={QUOTE_SOURCE_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={QUOTE_SOURCE_MAX_LENGTH}
            />

            <MyTextInput
                label="Who said this quote?"
                name='author'
                type='text'
                placeholder={QUOTE_AUTHOR_EXAMPLE}
                validationSchema={validationSchema}
                maxLength={QUOTE_AUTHOR_MAX_LENGTH}
            />
        </WizardStep>
    )

}

function EnterGuessSteps({ onSubmit, validationSchema }) {
    const formik = useFormikContext();

    const values = formik.values;
    const errors = formik.errors;

    const quoteParts = values.quoteParts;
    console.log("Quote parts:", quoteParts)

    // console.log("errors:", errors)
    const displayedAuthor = values.toGuess.includes('author') ? replaceAllNonSpace(values.author, '_') : values.author
    const displayedSource = values.toGuess.includes('source') ? replaceAllNonSpace(values.source, '_') : values.source
    const displayedQuote = values.toGuess.includes('quote') ? replaceSubstrings(values.quote, '_', values.quoteParts) : values.quote

    const ToGuessArrayErrors = () =>
        typeof errors.toGuess === 'string' && <StyledErrorMessage>{errors.toGuess}</StyledErrorMessage>

    const QuotePartsArrayErrors = () =>
        typeof errors.quoteParts === 'string' && <StyledErrorMessage>{errors.quoteParts}</StyledErrorMessage>


    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <Box component="section" sx={{ my: 2, p: 2, border: '2px solid white', maxWidth: '900px' }}>
                <span className='text-3xl text-center'>&quot;{displayedQuote}&quot;</span>
                <br />
                <span className='text-2xl text-center'>- {displayedAuthor}, <i>{displayedSource}</i></span>
            </Box>

            <br />

            <div id="checkbox-group" className='text-xl'>Which aspects of the quote do you want the players to guess?</div>
            <div role="group" aria-labelledby="checkbox-group">
                <label>
                    <Field type="checkbox" name="toGuess" value="source" />
                    The source (&quot;{values.source}&quot;)
                </label>
                <label>
                    <Field type="checkbox" name="toGuess" value="author" />
                    The author (&quot;{values.author}&quot;)
                </label>
                <label>
                    <Field type="checkbox" name="toGuess" value="quote" />
                    Parts of the quote (to be entered )
                </label>
            </div>
            <ToGuessArrayErrors />


            {/* Only display this if quote is checked */}
            {values.toGuess.includes('quote') && (
                <Box component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', maxWidth: '900px' }}>
                    <span className='text-xl'>Enter the parts of the quote you want the players to guess.</span>
                    <br />
                    <span className='text-xl'>The parts must not overlap and must be entered in order.</span>
                    <br />

                    <FieldArray name='quoteParts'>
                        {({ insert, remove, push, move }) => (
                            <>
                                {quoteParts.length > 0 &&
                                    quoteParts.map((quotePart, index) => (
                                        <EnterQuotePart
                                            key={index}
                                            quotePart={quotePart}
                                            index={index}
                                            onDelete={() => remove(index)}
                                            validationSchema={validationSchema}
                                        />
                                    ))}
                                <Button
                                    disabled={errors.quoteParts !== undefined && typeof errors.quoteParts !== 'string'}
                                    variant='outlined'
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        const lastEndIdx = quoteParts.length > 0 ? quoteParts[0].endIdx : -1;
                                        push({ startIdx: lastEndIdx + 1, endIdx: lastEndIdx + 1 })
                                    }}
                                >
                                    New quote part
                                </Button>
                            </>
                        )}
                    </FieldArray>

                    <QuotePartsArrayErrors />
                </Box>
            )}
        </WizardStep>
    );

}

function EnterQuotePart({ quotePart, index, onDelete, validationSchema }) {
    const formik = useFormikContext();
    const [field, meta] = useField(`quoteParts.${index}`);

    const startIdx = quotePart.startIdx;
    const endIdx = quotePart.endIdx;

    const quote = formik.values.quote;
    const quoteParts = formik.values.quoteParts;

    const lastEndIdx = findLastEndIdx(quoteParts, index);


    const minStartIdx = lastEndIdx + 1;
    const maxStartIdx = endIdx === -1 ? quote.length - 1 : endIdx;

    const minEndIdx = startIdx === -1 ? minStartIdx + 1 : startIdx;
    // const maxEndIdx = maxStartIdx + 1;
    const maxEndIdx = quote.length - 1;

    console.log(`startIdx: ${startIdx}, endIdx: ${endIdx}, lastEndIdx: ${lastEndIdx}`)
    console.log("minStartIdx:", minStartIdx)
    console.log("maxStartIdx:", maxStartIdx)
    console.log("minEndIdx:", minEndIdx)


    const disableInput = () => {
        return index !== 0
    }
    console.log(`index: ${index}, start: ${startIdx}, end: ${endIdx}, lastEnd: ${lastEndIdx}, disable: ${disableInput()}`)

    return (
        <div className='flex flex-col'>

            <span className='text-xl'>Part #{index + 1}: {startIdx !== -1 && endIdx !== -1 && (
                <span className='text-yellow-500'>&quot;{quote.substring(startIdx, endIdx + 1)}&quot;</span>
            )}</span>

            <div className='flex flex-row'>
                <MyTextInput
                    name={`quoteParts.${index}.startIdx`}
                    type='number'
                    placeholder={minStartIdx.toString()}
                    disabled={disableInput()}
                    min={minStartIdx}
                    max={maxStartIdx}
                    value={`quoteParts.${index}.startIdx`}
                    validationSchema={validationSchema}
                    maxLength={0}
                />

                <MyTextInput
                    name={`quoteParts.${index}.endIdx`}
                    type='number'
                    placeholder={minEndIdx.toString()}
                    disabled={disableInput()}
                    min={minEndIdx}
                    max={maxEndIdx}
                    value={`quoteParts.${index}.endIdx`}
                    validationSchema={validationSchema}
                    maxLength={0}
                />

                <IconButton
                    color='error'
                    onClick={onDelete}
                >
                    <DeleteIcon />
                </IconButton>

            </div>

            {/* <div className='flex flex-row'>
                <ErrorMessage name={`quoteParts.${index}.startIdx`} />
                <ErrorMessage name={`quoteParts.${index}.endIdx`} />
            </div> */}

        </div>
    )
}


function findLastEndIdx(quoteParts, index) {
    // Assume quoteParts is sorted by startIdx and endIdx
    // So just find the last such object and return its endIdx
    return index < quoteParts.length - 1 ? quoteParts[index + 1].endIdx : -1;
}
