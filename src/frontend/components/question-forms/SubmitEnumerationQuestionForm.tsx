import React from 'react';
import { useRouter } from 'next/navigation';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, IconButton } from '@mui/material';
import Box from '@mui/system/Box';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { ObjectSchema } from 'yup';

import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import { Wizard, WizardStep } from '@/frontend/components/common/MultiStepComponents';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import {
  MyNumberInput,
  MyRadioGroup,
  MyTextInput,
  StyledErrorMessage,
} from '@/frontend/components/common/StyledFormComponents';
import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';
import { Timer } from '@/models/timer';

const messages = defineMessages('frontend.forms.submitQuestion.enumeration', {
  numAnswersAllowed: 'Number of answers allowed',
  maxIsKnown: 'Is the total number of answers known?',
  thinkingTimeLabel: 'How many seconds should a player have to think and submit a bet?',
  challengeTimeLabel: 'How many seconds should the challenger have to enumerate its answers?',
});

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

interface QuestionFormProps {
  userId?: string;
  questionToEdit?: Record<string, unknown>;
  inGameEditor?: boolean;
  inSubmitPage?: boolean;
  gameId?: string;
  roundId?: string;
  onDialogClose?: () => void;
}

interface EnumFormValues {
  lang: string;
  topic: string;
  title: string;
  note: string;
  answer: string[];
  maxIsKnown: boolean | null;
  thinkingTime: number;
  challengeTime: number;
}

export default function SubmitEnumerationQuestionForm({ userId, ...props }: QuestionFormProps) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitEnumQuestion, isSubmitting] = useAsyncAction(async (values: EnumFormValues) => {
    try {
      const { topic, lang, ...others } = values;
      const { answer: _answer, maxIsKnown: _mik, ...rest } = others;
      if (q) {
        await editQuestion(
          {
            details: { ...rest, answer: others.answer, maxIsKnown: others.maxIsKnown },
            type: QUESTION_TYPE,
            topic,
            lang,
          },
          q.id as string
        );
      } else {
        const questionId = await submitQuestion(
          {
            details: { ...rest, answer: others.answer, maxIsKnown: others.maxIsKnown },
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
      }
    } catch (error) {
      console.error('Failed to submit your question:', error);
    }
  });

  return (
    <Wizard
      key={(q?.id as string) ?? 'new'}
      initialValues={
        q
          ? {
              lang: (q.lang as string) || DEFAULT_LOCALE,
              topic: (q.topic as string) || '',
              title: (q.title as string) || '',
              note: (q.note as string) || '',
              answer: (q.answer as string[]) || Array(EnumerationQuestion.MIN_NUM_ANSWERS).fill(''),
              maxIsKnown: (q.maxIsKnown as boolean | null) ?? null,
              thinkingTime: (q.thinkingTime as number) || 60,
              challengeTime: (q.challengeTime as number) || 60,
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              title: '',
              note: '',
              answer: Array(EnumerationQuestion.MIN_NUM_ANSWERS).fill(''),
              maxIsKnown: null,
              thinkingTime: 60,
              challengeTime: 60,
            }
      }
      onSubmit={async (values) => {
        await submitEnumQuestion(values as EnumFormValues);
        if (props.inSubmitPage) router.push('/submit');
        else if (props.inGameEditor) {
          props.onDialogClose?.();
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
              Timer.MIN_THINKING_TIME_SECONDS,
              `Must be between ${Timer.MIN_THINKING_TIME_SECONDS} and ${Timer.MAX_THINKING_TIME_SECONDS} seconds`
            )
            .max(
              Timer.MAX_THINKING_TIME_SECONDS,
              `Must be between ${Timer.MIN_THINKING_TIME_SECONDS} and ${Timer.MAX_THINKING_TIME_SECONDS} seconds`
            )
            .required('Required.'),
          challengeTime: Yup.number()
            .min(
              Timer.MIN_CHALLENGE_TIME_SECONDS,
              `Must be between ${Timer.MIN_CHALLENGE_TIME_SECONDS} and ${Timer.MAX_CHALLENGE_TIME_SECONDS} seconds`
            )
            .max(
              Timer.MAX_CHALLENGE_TIME_SECONDS,
              `Must be between ${Timer.MIN_CHALLENGE_TIME_SECONDS} and ${Timer.MAX_CHALLENGE_TIME_SECONDS} seconds`
            )
            .required('Required.'),
        })}
      />
    </Wizard>
  );
}

interface StepProps {
  onSubmit: () => void;
  validationSchema: ObjectSchema<Record<string, unknown>>;
}

function GeneralInfoStep({ onSubmit, validationSchema }: StepProps) {
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

function EnterAnswerItemsStep({ onSubmit, validationSchema }: StepProps) {
  const intl = useIntl();
  const formik = useFormikContext<{ answer: string[]; maxIsKnown: boolean | null }>();

  const values = formik.values;
  const errors = formik.errors;

  const exampleAnswers = intl.locale === 'fr' ? ENUM_ANSWER_EXAMPLE['fr'] : ENUM_ANSWER_EXAMPLE['en'];

  const ItemArrayErrors = () =>
    typeof errors.answer === 'string' && <StyledErrorMessage>{errors.answer}</StyledErrorMessage>;

  const ItemError = ({ index }: { index: number }) => {
    const [, meta] = useField('answer.' + index);
    return (
      typeof errors.answer === 'object' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  const MaxIsKnownError = () => {
    const [, meta] = useField('maxIsKnown');
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
        trueText={intl.formatMessage(globalMessages.yes)}
        falseText={intl.formatMessage(globalMessages.no)}
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
      <MaxIsKnownError />
    </WizardStep>
  );
}

function EnterTimesStep({ onSubmit, validationSchema }: StepProps) {
  const intl = useIntl();
  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <MyNumberInput
        label={intl.formatMessage(messages.thinkingTimeLabel)}
        name="thinkingTime"
        min={Timer.MIN_THINKING_TIME_SECONDS}
        max={Timer.MAX_THINKING_TIME_SECONDS}
        // validationSchema={validationSchema}
      />

      <MyNumberInput
        label={intl.formatMessage(messages.challengeTimeLabel)}
        name="challengeTime"
        min={Timer.MIN_CHALLENGE_TIME_SECONDS}
        max={Timer.MAX_CHALLENGE_TIME_SECONDS}
        // validationSchema={validationSchema}
      />
    </WizardStep>
  );
}
