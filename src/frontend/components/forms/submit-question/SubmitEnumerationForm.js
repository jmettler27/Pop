import { QuestionType } from '@/backend/models/questions/QuestionType';
import { EnumerationQuestion } from '@/backend/models/questions/Enumeration';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { messages as questionMessages } from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import {
  numCharsIndicator,
  requiredFieldIndicator,
  requiredStringInArrayFieldIndicator,
  stringSchema,
} from '@/frontend/utils/forms/forms';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.submitQuestion.enumeration', {
  numAnswersAllowed: 'Number of answers allowed',
  maxIsKnown: 'Is the total number of answers known?',
  yes: 'Yes',
  no: 'No',
  thinkingTimeLabel: 'How many seconds should a player have to think and submit a bet?',
  challengeTimeLabel: 'How many seconds should the challenger have to enumerate its answers?',
});

import {
  MyTextInput,
  StyledErrorMessage,
  MyNumberInput,
  MyRadioGroup,
} from '@/frontend/components/forms/StyledFormComponents';
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

import { useRouter } from 'next/navigation';

import React from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

const QUESTION_TYPE = QuestionType.ENUMERATION;

const ENUM_ANSWER_EXAMPLE = {
  en: [
    'Green',
    'Blue',
    'Red',
    'Yellow',
    'Gold',
    'Silver',
    'Crystal',
    'Ruby',
    'Sapphire',
    'Emerald',
    'Diamond',
    'FireRed',
    'LeafGreen',
    'Pearl',
    'Platinum',
    'HeartGold',
    'SoulSilver',
    'Black',
    'White',
    'Black 2',
    'White 2',
    'X',
    'Y',
    'Omega Ruby',
    'Alpha Sapphire',
    'Sun',
    'Moon',
    'Ultra Sun',
    'Ultra Moon',
    "Let's Go, Pikachu!",
    "Let's Go, Eevee!",
    'Sword',
    'Shield',
    'Brilliant Diamond',
    'Shining Pearl',
    'Legends Arceus',
    'Violet',
    'Scarlet',
  ],
  fr: [
    'Vert',
    'Bleu',
    'Rouge',
    'Jaune',
    'Or',
    'Argent',
    'Cristal',
    'Rubis',
    'Saphir',
    'Emeraude',
    'Diamant',
    'Vert Feuille',
    'Rouge Feu',
    'Perle',
    'Platine',
    'Or HeartGold',
    'Argent SoulSilver',
    'Noir',
    'Blanc',
    'Noir 2',
    'Blanc 2',
    'X',
    'Y',
    'Rubis Oméga',
    'Saphir Alpha',
    'Soleil',
    'Lune',
    'Ultra Soleil',
    'Ultra Lune',
    "Let's Go, Pikachu!",
    "Let's Go, Eevee!",
    'Epée',
    'Bouclier',
    'Diamant Etincelant',
    'Perle Scintillante',
    'Légendes Arceus',
    'Violet',
    'Ecarlate',
  ],
};

const enumAnswerSchema = () =>
  Yup.array()
    .of(stringSchema(EnumerationQuestion.ANSWER_ITEM_MAX_LENGTH))
    .min(EnumerationQuestion.MIN_NUM_ANSWERS, `There must be at least ${EnumerationQuestion.MIN_NUM_ANSWERS} answers`)
    .max(EnumerationQuestion.MAX_NUM_ANSWERS, `There can be at most ${EnumerationQuestion.MAX_NUM_ANSWERS} answers`);

export default function SubmitEnumerationQuestionForm({ userId, ...props }) {
  const intl = useIntl();
  const router = useRouter();

  const [submitEnumQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, ...others } = values;
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
        await addQuestionToRound(props.gameId, props.roundId, questionId, userId);
      }
    } catch (error) {
      console.error('Failed to submit your question:', error);
    }
  });

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
      onSubmit={async (values) => {
        await submitEnumQuestion(values);
        if (props.inSubmitPage) router.push('/submit');
        else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
      isSubmitting={isSubmitting}
    >
      {/* Step 1: General info */}
      <GeneralInfoStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          lang: localeSchema(),
          topic: topicSchema(),
          title: stringSchema(EnumerationQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(EnumerationQuestion.NOTE_MAX_LENGTH, false),
        })}
      />

      {/* Step 2: answer */}
      <EnterAnswerItemsStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          answer: enumAnswerSchema(),
          maxIsKnown: Yup.boolean().required('Required.'),
        })}
      />

      {/* Step 3: Times */}
      <EnterTimesStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          thinkingTime: Yup.number()
            .min(
              EnumerationQuestion.MIN_THINKING_SECONDS,
              `Must be between ${EnumerationQuestion.MIN_THINKING_SECONDS} and ${EnumerationQuestion.MAX_THINKING_SECONDS} seconds`
            )
            .max(
              EnumerationQuestion.MAX_THINKING_SECONDS,
              `Must be between ${EnumerationQuestion.MIN_THINKING_SECONDS} and ${EnumerationQuestion.MAX_THINKING_SECONDS} seconds`
            )
            .required('Required.'),
          challengeTime: Yup.number()
            .min(
              EnumerationQuestion.MIN_CHALLENGE_SECONDS,
              `Must be between ${EnumerationQuestion.MIN_CHALLENGE_SECONDS} and ${EnumerationQuestion.MAX_CHALLENGE_SECONDS} seconds`
            )
            .max(
              EnumerationQuestion.MAX_CHALLENGE_SECONDS,
              `Must be between ${EnumerationQuestion.MIN_CHALLENGE_SECONDS} and ${EnumerationQuestion.MAX_CHALLENGE_SECONDS} seconds`
            )
            .required('Required.'),
        })}
      />
    </Wizard>
  );
}

function GeneralInfoStep({ onSubmit, validationSchema }) {
  const intl = useIntl();
  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <SelectLanguage name="lang" validationSchema={validationSchema} />

      <SelectQuestionTopic name="topic" validationSchema={validationSchema} />

      <MyTextInput
        label={intl.formatMessage(questionMessages.questionTitle)}
        name="title"
        type="text"
        placeholder="List all Pokémon versions"
        validationSchema={validationSchema}
        maxLength={EnumerationQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.hintsRemarks)}
        name="note"
        type="text"
        placeholder="Main series only!"
        validationSchema={validationSchema}
        maxLength={EnumerationQuestion.NOTE_MAX_LENGTH}
      />
    </WizardStep>
  );
}

function EnterAnswerItemsStep({ onSubmit, validationSchema }) {
  const intl = useIntl();
  const formik = useFormikContext();

  const values = formik.values;
  const errors = formik.errors;

  const exampleAnswers = intl.locale === 'fr' ? ENUM_ANSWER_EXAMPLE['fr'] : ENUM_ANSWER_EXAMPLE['en'];

  const ItemArrayErrors = () =>
    typeof errors.answer === 'string' && <StyledErrorMessage>{errors.answer}</StyledErrorMessage>;

  const ItemError = ({ index }) => {
    const [_, meta] = useField('answer.' + index);
    return (
      typeof errors.answer === 'object' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  const MaxIsKnownError = () => {
    const [_, meta] = useField('maxIsKnown');
    return (
      typeof errors.maxIsKnown === 'string' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <p>
        {intl.formatMessage(messages.numAnswersAllowed)}: {EnumerationQuestion.MIN_NUM_ANSWERS}-
        {EnumerationQuestion.MAX_NUM_ANSWERS}.
      </p>

      <MyRadioGroup
        label={intl.formatMessage(messages.maxIsKnown)}
        name="maxIsKnown"
        trueText={intl.formatMessage(messages.yes)}
        falseText={intl.formatMessage(messages.no)}
        validationSchema={validationSchema}
      />

      <FieldArray name="answer">
        {({ remove, push }) => (
          <div>
            {values.answer.length > 0 &&
              values.answer.map((item, index) => (
                <Box
                  key={index}
                  component="section"
                  sx={{ my: 2, pb: 2, px: 2, border: '2px dashed grey', width: '500px' }}
                >
                  <label htmlFor={'answer.' + index}>
                    {requiredStringInArrayFieldIndicator(validationSchema, 'answer', intl)}
                    {intl.formatMessage(questionMessages.item)} #{index + 1}{' '}
                    {numCharsIndicator(item, EnumerationQuestion.ANSWER_ITEM_MAX_LENGTH)}
                  </label>
                  <Field
                    name={'answer.' + index}
                    type="text"
                    placeholder={exampleAnswers[index % exampleAnswers.length]}
                  />
                  <IconButton color="error" onClick={() => remove(index)}>
                    <DeleteIcon />
                  </IconButton>

                  <ItemError index={index} />
                </Box>
              ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => push('')}>
              {intl.formatMessage(questionMessages.addItem)}
            </Button>
          </div>
        )}
      </FieldArray>

      <ItemArrayErrors />
    </WizardStep>
  );
}

function EnterTimesStep({ onSubmit, validationSchema }) {
  const intl = useIntl();
  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <MyNumberInput
        label={intl.formatMessage(messages.thinkingTimeLabel)}
        name="thinkingTime"
        min={EnumerationQuestion.MIN_THINKING_SECONDS}
        max={EnumerationQuestion.MAX_THINKING_SECONDS}
        // validationSchema={validationSchema}
      />

      <MyNumberInput
        label={intl.formatMessage(messages.challengeTimeLabel)}
        name="challengeTime"
        min={EnumerationQuestion.MIN_CHALLENGE_SECONDS}
        max={EnumerationQuestion.MAX_CHALLENGE_SECONDS}
        // validationSchema={validationSchema}
      />
    </WizardStep>
  );
}
