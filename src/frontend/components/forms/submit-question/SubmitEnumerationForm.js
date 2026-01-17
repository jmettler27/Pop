import { QuestionType } from '@/backend/models/questions/QuestionType';
import { EnumerationQuestion } from '@/backend/models/questions/Enumeration';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { ADD_ITEM, QUESTION_HINTS_REMARKS, QUESTION_ITEM, QUESTION_TITLE_LABEL } from '@/frontend/utils/forms/questions';



import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import { numCharsIndicator, requiredFieldIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/frontend/utils/forms/forms';

import { MyTextInput, StyledErrorMessage, MyNumberInput, MyRadioGroup } from '@/frontend/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';


import { useRouter } from 'next/navigation'

import React from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';



const QUESTION_TYPE = QuestionType.ENUMERATION;


const ENUM_TITLE_EXAMPLE = {
    'en': "List all Pokémon versions",
    'fr-FR': "Cite toutes les versions de Pokémon"
}

const ENUM_NOTE_EXAMPLE = {
    'en': "Main series only!",
    'fr-FR': "Série principale uniquement !"
}

const ENUM_ANSWER_EXAMPLE =
{
    'en': [
        "Green",
        "Blue",
        "Red",
        "Yellow",
        "Gold",
        "Silver",
        "Crystal",
        "Ruby",
        "Sapphire",
        "Emerald",
        "Diamond",
        "FireRed",
        "LeafGreen",
        "Pearl",
        "Platinum",
        "HeartGold",
        "SoulSilver",
        "Black",
        "White",
        "Black 2",
        "White 2",
        "X",
        "Y",
        "Omega Ruby",
        "Alpha Sapphire",
        "Sun",
        "Moon",
        "Ultra Sun",
        "Ultra Moon",
        "Let's Go, Pikachu!",
        "Let's Go, Eevee!",
        "Sword",
        "Shield",
        "Brilliant Diamond",
        "Shining Pearl",
        "Legends Arceus",
        "Violet",
        "Scarlet",
    ],
    'fr-FR': [
        "Vert",
        "Bleu",
        "Rouge",
        "Jaune",
        "Or",
        "Argent",
        "Cristal",
        "Rubis",
        "Saphir",
        "Emeraude",
        "Diamant",
        "Vert Feuille",
        "Rouge Feu",
        "Perle",
        "Platine",
        "Or HeartGold",
        "Argent SoulSilver",
        "Noir",
        "Blanc",
        "Noir 2",
        "Blanc 2",
        "X",
        "Y",
        "Rubis Oméga",
        "Saphir Alpha",
        "Soleil",
        "Lune",
        "Ultra Soleil",
        "Ultra Lune",
        "Let's Go, Pikachu!",
        "Let's Go, Eevee!",
        "Epée",
        "Bouclier",
        "Diamant Etincelant",
        "Perle Scintillante",
        "Légendes Arceus",
        "Violet",
        "Ecarlate",
    ]
}




const enumAnswerSchema = () => Yup.array()
    .of(stringSchema(EnumerationQuestion.ANSWER_ITEM_MAX_LENGTH))
    .min(EnumerationQuestion.MIN_NUM_ANSWERS, `There must be at least ${EnumerationQuestion.MIN_NUM_ANSWERS} answers`)
    .max(EnumerationQuestion.MAX_NUM_ANSWERS, `There can be at most ${EnumerationQuestion.MAX_NUM_ANSWERS} answers`)


export default function SubmitEnumerationQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitEnumQuestion, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { topic, lang, ...details } = values;
            const { picked, ...rest } = details;
            const questionId = await submitQuestion(
                {
                    details: { ...rest },
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
                title: '',
                note: '',
                answer: Array(EnumerationQuestion.MIN_NUM_ANSWERS).fill(''),
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
                    title: stringSchema(EnumerationQuestion.TITLE_MAX_LENGTH),
                    note: stringSchema(EnumerationQuestion.NOTE_MAX_LENGTH, false),
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
                        .min(EnumerationQuestion.MIN_THINKING_SECONDS, `Must be between ${EnumerationQuestion.MIN_THINKING_SECONDS} and ${EnumerationQuestion.MAX_THINKING_SECONDS} seconds`)
                        .max(EnumerationQuestion.MAX_THINKING_SECONDS, `Must be between ${EnumerationQuestion.MIN_THINKING_SECONDS} and ${EnumerationQuestion.MAX_THINKING_SECONDS} seconds`)
                        .required("Required."),
                    challengeTime: Yup.number()
                        .min(EnumerationQuestion.MIN_CHALLENGE_SECONDS, `Must be between ${EnumerationQuestion.MIN_CHALLENGE_SECONDS} and ${EnumerationQuestion.MAX_CHALLENGE_SECONDS} seconds`)
                        .max(EnumerationQuestion.MAX_CHALLENGE_SECONDS, `Must be between ${EnumerationQuestion.MIN_CHALLENGE_SECONDS} and ${EnumerationQuestion.MAX_CHALLENGE_SECONDS} seconds`)
                        .required("Required."),
                })}
                lang={lang}
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
                placeholder={ENUM_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={EnumerationQuestion.TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_HINTS_REMARKS[lang]}
                name='note'
                type='text'
                placeholder={ENUM_NOTE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={EnumerationQuestion.NOTE_MAX_LENGTH}
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
            <p>{NUM_ANSWERS_ALLOWED[lang]}: {EnumerationQuestion.MIN_NUM_ANSWERS}-{EnumerationQuestion.MAX_NUM_ANSWERS}.</p>

            <MyRadioGroup
                label={MAX_IS_KNOWN[lang]}
                name='maxIsKnown'
                // options={[
                //     { value: true, label: 'Yes' },
                //     { value: false, label: 'No' },
                // ]}
                trueText={TRUE_TEXT[lang]}
                falseText={FALSE_TEXT[lang]}
                validationSchema={validationSchema}
            />

            <FieldArray name='answer'>
                {({ remove, push }) => (
                    <div>
                        {values.answer.length > 0 &&
                            values.answer.map((item, index) => (
                                <Box key={index} component='section' sx={{ my: 2, pb: 2, px: 2, border: '2px dashed grey', width: '500px' }}>
                                    <label htmlFor={'answer.' + index}>{requiredStringInArrayFieldIndicator(validationSchema, 'answer')}{QUESTION_ITEM[lang]} #{index + 1} {numCharsIndicator(item, EnumerationQuestion.ANSWER_ITEM_MAX_LENGTH)}</label>
                                    <Field
                                        name={'answer.' + index}
                                        type='text'
                                        placeholder={ENUM_ANSWER_EXAMPLE[lang][index % ENUM_ANSWER_EXAMPLE.length]}
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
    'en': "Number of answers allowed",
    'fr-FR': "Nombre de réponses autorisé",
}

const MAX_IS_KNOWN = {
    'en': "Is the total number of answers known?",
    'fr-FR': "Le nombre total de réponses est-il connu ?",
}

const TRUE_TEXT = {
    'en': "Yes",
    'fr-FR': "Oui",
}

const FALSE_TEXT = {
    'en': "No",
    'fr-FR': "Non",
}

function EnterTimesStep({ onSubmit, validationSchema, lang }) {
    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <MyNumberInput
                label={ENUM_THINKING_LABEL[lang]}
                name='thinkingTime'
                min={EnumerationQuestion.MIN_THINKING_SECONDS} max={EnumerationQuestion.MAX_THINKING_SECONDS}
            // validationSchema={validationSchema}
            />

            <MyNumberInput
                label={ENUM_CHALLENGE_LABEL[lang]}
                name='challengeTime'
                min={EnumerationQuestion.MIN_CHALLENGE_SECONDS} max={EnumerationQuestion.MAX_CHALLENGE_SECONDS}
            // validationSchema={validationSchema}
            />
        </WizardStep>
    )
}

const ENUM_THINKING_LABEL = {
    'en': "How many seconds should a player have to think and submit a bet?",
    'fr-FR': "Combien de secondes un joueur doit-il avoir pour réfléchir et soumettre un pari ?",
}

const ENUM_CHALLENGE_LABEL = {
    'en': "How many seconds should the challenger have to enumerate its answers?",
    'fr-FR': "Combien de secondes le challenger doit-il avoir pour énumérer ses réponses ?",
}