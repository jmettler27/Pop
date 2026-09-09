import { useRouter } from 'next/navigation';

import { Field, FieldArray, useField, useFormikContext } from 'formik';
import { Plus, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { ObjectSchema } from 'yup';

import { Wizard, WizardStep } from '@/components/common/MultiStepComponents';
import SelectLanguage from '@/components/common/SelectLanguage';
import SelectQuestionTopic from '@/components/common/SelectQuestionTopic';
import {
  FieldError,
  MyNumberInput,
  MyRadioGroup,
  MyTextInput,
  StyledErrorMessage,
} from '@/components/common/StyledFormComponents';
import { Button } from '@/components/ui/button';
import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/helpers/forms/forms';
import { messages as questionMessages } from '@/helpers/forms/questions';
import { submitQuestionForm, type QuestionFormPayload } from '@/helpers/forms/submitQuestionForm';
import { topicSchema } from '@/helpers/forms/topics';
import { DEFAULT_LOCALE, Locale, localeSchema } from '@/helpers/locales';
import useAsyncAction from '@/hooks/useAsyncAction';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';
import { Timer } from '@/models/timer';
import { Topic } from '@/models/topic';

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

export default function SubmitEnumerationQuestionForm(props: QuestionFormProps) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitEnumQuestion, isSubmitting] = useAsyncAction(async (values: EnumFormValues) => {
    try {
      const { topic, lang, ...others } = values as typeof values & { topic: Topic; lang: Locale };
      const { answer: _answer, maxIsKnown: _mik, ...rest } = others;
      const data: QuestionFormPayload = {
        type: QUESTION_TYPE,
        topic,
        lang,
        details: { ...rest, answer: others.answer, maxIsKnown: others.maxIsKnown },
      };
      await submitQuestionForm(data, {
        editId: q?.id as string | undefined,
        round: props.inGameEditor ? { gameId: props.gameId as string, roundId: props.roundId as string } : undefined,
      });
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

  const ItemError = ({ index }: { index: number }) => {
    const [, meta] = useField('answer.' + index);
    return (
      typeof errors.answer === 'object' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <p className="mb-4">
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
                <section key={index} className="my-4 pb-4 px-4 border-2 border-dashed border-gray-500 w-[500px]">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>

                  <ItemError index={index} />
                </section>
              ))}
            <Button variant="outline" onClick={() => push('')}>
              <Plus className="mr-2 size-4" />
              {intl.formatMessage(questionMessages.addItem)}
            </Button>
          </div>
        )}
      </FieldArray>

      {typeof errors.answer === 'string' && <StyledErrorMessage>{errors.answer}</StyledErrorMessage>}
      <FieldError name="maxIsKnown" />
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
