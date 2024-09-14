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
    replaceAllNonSpace, replaceSubstrings,
    quoteElementToEmoji
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
import { QUESTION_ELEMENT_TO_EMOJI } from '@/lib/utils/question/question';

const QUESTION_TYPE = 'quote'

export default function Page({ lang = DEFAULT_LOCALE }) {
    const { data: session } = useSession()

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <>
            <QuestionFormHeader questionType={QUESTION_TYPE} lang={lang} />
            <SubmitQuoteQuestionForm userId={session.user.id} lang={lang} inSubmitPage={true} />
        </>
    );
}

export function SubmitQuoteQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitQuoteQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values
            if (!(details.toGuess.includes('quote'))) {
                details.quoteParts = [];
            } else {
                details.quoteParts = values.quoteParts.sort((a, b) => a.startIdx - b.startIdx)
            }
            const questionId = await addNewQuestion({
                details: { ...details },
                type: QUESTION_TYPE,
                topic,
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
                lang={lang}
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
                lang={lang}
            />
        </Wizard>
    )
}

function GeneralInfoStep({ onSubmit, validationSchema, lang }) {
    const formik = useFormikContext();
    const values = formik.values;

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <SelectLanguage lang={lang} name='lang' validationSchema={validationSchema} />

            <SelectQuestionTopic lang={lang} name='topic' validationSchema={validationSchema} />

            <MyTextInput
                label={QUOTE[lang]}
                name='quote'
                type='text'
                placeholder={QUOTE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={QUOTE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUOTE_AUTHOR[lang]}
                name='author'
                type='text'
                placeholder={QUOTE_AUTHOR_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={QUOTE_AUTHOR_MAX_LENGTH}
            />

            <MyTextInput
                label={QUOTE_SOURCE[lang]}
                name='source'
                type='text'
                placeholder={QUOTE_SOURCE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={QUOTE_SOURCE_MAX_LENGTH}
            />

        </WizardStep>
    )

}

const QUOTE = {
    'en': "Quote",
    'fr-FR': "Réplique",
}

const QUOTE_SOURCE = {
    'en': "Source of the quote",
    'fr-FR': "Source de la réplique",
}

const QUOTE_AUTHOR = {
    'en': "Author of the quote",
    'fr-FR': "Auteur de la réplique",
}


function EnterGuessSteps({ onSubmit, validationSchema, lang }) {
    const formik = useFormikContext();

    const values = formik.values;
    const errors = formik.errors;

    const quoteParts = values.quoteParts;
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
            <div className='flex flex-col w-full space-y-2'>
                <blockquote className='2xl:text-3xl text-center'>&quot;{displayedQuote}&quot;</blockquote>
                {values.author && <span className='2xl:text-2xl text-center'>{QUESTION_ELEMENT_TO_EMOJI['author']} {displayedAuthor}</span>}
                {values.source && <span className='2xl:text-2xl text-center'>{QUESTION_ELEMENT_TO_EMOJI['source']} <i>{displayedSource}</i></span>}
            </div>

            <br />

            <div id="checkbox-group" className='2xl:text-xl'>{QUOTE_ASPECTS_TO_GUESS[lang]}</div>
            <div role="group" aria-labelledby="checkbox-group">
                <label>
                    <Field type="checkbox" name="toGuess" value="source" />
                    {quoteElementToEmoji('source')} {QUOTE_SOURCE[lang]} (&quot;{values.source}&quot;)
                </label>
                <label>
                    <Field type="checkbox" name="toGuess" value="author" />
                    {quoteElementToEmoji('author')} {QUOTE_AUTHOR[lang]} (&quot;{values.author}&quot;)
                </label>
                <label>
                    <Field type="checkbox" name="toGuess" value="quote" />
                    {quoteElementToEmoji('quote')} {QUOTE_PARTS[lang]}
                </label>
            </div>
            <ToGuessArrayErrors />


            {/* Only display this if quote is checked */}
            {values.toGuess.includes('quote') && (
                <Box component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', maxWidth: '900px' }}>
                    <span className='2xl:text-xl'>{ENTER_QUOTE_PARTS[lang]}</span>
                    <br />
                    <span className='2xl:text-xl'>{QUOTE_PARTS_MUST_NOT_OVERLAP[lang]}</span>
                    <br />

                    <FieldArray name='quoteParts'>
                        {({ remove, push }) => (
                            <>
                                {quoteParts.length > 0 &&
                                    quoteParts.map((quotePart, index) => (
                                        <EnterQuotePart
                                            key={index}
                                            quotePart={quotePart}
                                            index={index}
                                            onDelete={() => remove(index)}
                                            validationSchema={validationSchema}
                                            lang={lang}
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
                                    {ADD_QUOTE_PART[lang]}
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

const QUOTE_ASPECTS_TO_GUESS = {
    'en': "Which aspects of the quote do you want the players to guess?",
    'fr-FR': "Quels aspects de la réplique voulez-vous que les joueurs devinent?"
}

const QUOTE_PARTS = {
    'en': "Parts of the quote (to be entered)",
    'fr-FR': "Morceaux de la réplique (à entrer)"
}

const ENTER_QUOTE_PARTS = {
    'en': "Enter the parts of the quote to guess.",
    'fr-FR': "Entrez les morceaux à deviner."
}

const QUOTE_PARTS_MUST_NOT_OVERLAP = {
    'en': "The parts must not overlap and must be entered in order.",
    'fr-FR': "Les morceaux ne doivent pas se chevaucher et doivent être entrées dans l'ordre."
}

const ADD_QUOTE_PART = {
    'en': "Add part",
    'fr-FR': "Ajouter morceau"
}


function EnterQuotePart({ quotePart, index, onDelete, validationSchema, lang }) {
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

            <span className='2xl:text-xl'>{QUOTE_PART[lang]} #{index + 1}: {startIdx !== -1 && endIdx !== -1 && (
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

const QUOTE_PART = {
    'en': "Part",
    'fr-FR': "Morceau"
}


function findLastEndIdx(quoteParts, index) {
    // Assume quoteParts is sorted by startIdx and endIdx
    // So just find the last such object and return its endIdx
    return index < quoteParts.length - 1 ? quoteParts[index + 1].endIdx : -1;
}
