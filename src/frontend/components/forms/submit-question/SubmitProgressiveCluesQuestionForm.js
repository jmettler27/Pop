import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ProgressiveCluesQuestion } from '@/backend/models/questions/ProgressiveClues';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { QUESTION_ANSWER_LABEL, QUESTION_TITLE_LABEL } from '@/frontend/utils/forms/questions';


import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/frontend/utils/forms/forms';
import { getFileFromRef, imageFileSchema } from '@/frontend/utils/forms/files';

import { MyTextInput, StyledErrorMessage } from '@/frontend/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import { UploadImage } from '@/frontend/components/forms/UploadFile';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';


import { useRouter } from 'next/navigation';

import React, { useRef } from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';


import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { IconButton } from '@mui/material';

const QUESTION_TYPE = QuestionType.PROGRESSIVE_CLUES;


const PROGRESSIVE_CLUES_TITLE_EXAMPLE = {
    'en': "Actor",
    'fr-FR': "Acteur"
}

const PROGRESSIVE_CLUES_ANSWER_TITLE_EXAMPLE = {
    'en': "Nicolas Cage",
    'fr-FR': "Nicolas Cage"
}

const PROGRESSIVE_CLUES_CLUES_EXAMPLE =
{
    'en': [
        "My actor was born in the 1960s.",
        "As a huge comic book fan, my stage name refers to the surname of a Marvel superhero.",
        "I also lent my voice to Superman and Spider-Man.",
        "Among the directors I've worked with are the Coen brothers, Martin Scorsese, John Woo and David Lynch.",
        "My career reached its critical and commercial peak in the 1990s.",
        "...but it would later be littered with a huge number of B-movies.",
        "I'm part of the Coppola family.",
        "I played an arms dealer, a biker superhero and a treasure hunter...",
        "...named Benjamin Gates.",
        "Nicolas in a cage."
    ],
    'fr-FR': [
        "Mon acteur est né dans les années 1960",
        "En tant que grand fan de comics, mon nom de scène fait référence au nom de famille d’un super-héros Marvel.",
        "De plus, j’ai prêté ma voix à Superman et à Spider-Man.",
        "Parmi les réalisateurs avec qui j’ai collaboré, on compte les frères Coen, Martin Scorsese, John Woo ou encore David Lynch.",
        "Ma carrière atteint son apogée critique et commercial dans les années 1990...",
        "…mais elle sera plus tard jonchée d’énormément de films de série B.",
        "Je fais partie de la famille Coppola.",
        "J’ai interprété tour à tour un marchand d’armes, un super-héros motard et un chasseur de trésors...",
        "...nommé Benjamin Gates.",
        "Nicolas dans sa cage."
    ]
}


const progressiveCluesSchema = () => Yup.array()
    .of(Yup.string()
        .trim()
        .max(ProgressiveCluesQuestion.CLUE_MAX_LENGTH, `Must be ${ProgressiveCluesQuestion.CLUE_MAX_LENGTH} characters or less.`)
        .required("Required."))
    .min(ProgressiveCluesQuestion.MIN_NUM_CLUES, `There must be at least ${ProgressiveCluesQuestion.MIN_NUM_CLUES} clues.`)
    .max(ProgressiveCluesQuestion.MAX_NUM_CLUES, `There can be at most ${ProgressiveCluesQuestion.MAX_NUM_CLUES} clues.`)


export default function SubmitProgressiveCluesQuestionForm({ userId, lang, ...props }) {
    const router = useRouter()

    const [submitProgressiveCluesQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
        try {
            const { files, topic, lang, ...details } = values;
            const { title, clues, answer_title } = details;
            
            // Get the file from the ref if it exists
            const image = getFileFromRef(fileRef);
            const questionId = await submitQuestion(
                {
                    details: {
                        title,
                        clues,
                        answer: {
                            title: answer_title
                        }
                    },
                    type: QUESTION_TYPE,
                    topic,
                    lang,
                },
                userId,
                {
                    image: image,
                }
        );

            if (props.inGameEditor) {
                await addQuestionToRound(props.gameId, props.roundId, questionId, userId);
            }
        } catch (error) {
            console.error("There was an error submitting your question:", error)
        }
    })

    const fileRef = useRef(null);

    return (
        <Wizard
            initialValues={{
                lang: DEFAULT_LOCALE,
                topic: '',
                title: '',
                answer_title: '',
                clues: [''],
                files: '',
            }}
            onSubmit={async values => {
                await submitProgressiveCluesQuestion(values, fileRef)
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
                    title: stringSchema(ProgressiveCluesQuestion.TITLE_MAX_LENGTH),
                    answer_title: stringSchema(ProgressiveCluesQuestion.ANSWER_TITLE_MAX_LENGTH),
                })}
                lang={lang}
            />

            {/* Step 2: clues */}
            <EnterCluesStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    clues: progressiveCluesSchema(),
                })}
                lang={lang}
            />

            {/* Step 3: image */}
            <SelectImageStep
                onSubmit={() => { }}
                validationSchema={Yup.object({
                    files: imageFileSchema(fileRef, false),
                })}
                fileRef={fileRef}
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
                placeholder={PROGRESSIVE_CLUES_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={ProgressiveCluesQuestion.TITLE_MAX_LENGTH}
            />

            <MyTextInput
                label={QUESTION_ANSWER_LABEL[lang]}
                name='answer_title'
                type='text'
                placeholder={PROGRESSIVE_CLUES_ANSWER_TITLE_EXAMPLE[lang]}
                validationSchema={validationSchema}
                maxLength={ProgressiveCluesQuestion.ANSWER_TITLE_MAX_LENGTH}
            />
        </WizardStep>
    )
}

function EnterCluesStep({ onSubmit, validationSchema, lang }) {
    const formik = useFormikContext();

    const values = formik.values
    const errors = formik.errors

    // https://formik.org/docs/api/fieldarray#fieldarray-validation-gotchas
    const ClueArrayErrors = () =>
        typeof errors.clues === 'string' && <StyledErrorMessage>{errors.clues}</StyledErrorMessage>
    const ClueError = ({ index }) => {
        const [_, meta] = useField('clues.' + index);
        return typeof errors.clues === 'object' && meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    }

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <p>{NUM_CLUES_ALLOWED[lang]}: {ProgressiveCluesQuestion.MIN_NUM_CLUES}-{ProgressiveCluesQuestion.MAX_NUM_CLUES}</p>

            <FieldArray name='clues'>
                {({ remove, push }) => (
                    <div>
                        {values.clues.length > 0 &&
                            values.clues.map((clue, index) => (
                                <div className='row' key={index}>
                                    <label htmlFor={'clues.' + index}>{requiredStringInArrayFieldIndicator(validationSchema, 'clues')}{CLUE[lang]} #{index + 1} {numCharsIndicator(clue, ProgressiveCluesQuestion.CLUE_MAX_LENGTH)}</label>
                                    <Field
                                        name={'clues.' + index}
                                        placeholder={index < PROGRESSIVE_CLUES_CLUES_EXAMPLE[lang].length ? PROGRESSIVE_CLUES_CLUES_EXAMPLE[lang][index] : 'Some clue'}
                                        type='text'
                                    />
                                    {/* <ClueTextField index={index} /> */}

                                    <IconButton
                                        color='error'
                                        onClick={() => remove(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                    <ClueError index={index} />

                                </div>
                            ))}
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => push('')}
                        >
                            {ADD_CLUE[lang]}
                        </Button>

                    </div>
                )}
            </FieldArray>

            <ClueArrayErrors />

        </WizardStep>
    )
}

const NUM_CLUES_ALLOWED = {
    'en': "Number of clues allowed",
    'fr-FR': "Nombre d'indices autorisé"

}

const CLUE = {
    'en': "Clue",
    'fr-FR': "Indice"
}

const ADD_CLUE = {
    'en': "Add clue",
    'fr-FR': "Ajouter indice"
}


function ClueTextField({ index }) {

    const formik = useFormikContext();

    return (

        <TextField
            // fullWidth
            id={'clues.' + index}
            name={'clues.' + index}
            label={`Clue #${index + 1}`}
            placeholder={PROGRESSIVE_CLUES_CLUES_EXAMPLE[index]}
            multiline
            maxRows={4}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            // className='placeholder-red-500 text-base bg-[color:var(--gray-800)] text-[white] border-[color:var(--gray-700)] appearance-none px-2 py-[0.65rem] rounded-[10px] border-2 border-solid w-[400px]'
            sx={{
                width: '400px'
                // 'MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline css-1sqnrkk-MuiInputBase-input-MuiOutlinedInput-input'
            }}
        />
    )
}


function SelectImageStep({ onSubmit, validationSchema, fileRef, lang }) {
    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <UploadImage fileRef={fileRef} name='files' validationSchema={validationSchema} lang={lang} />
        </WizardStep>
    )
}
