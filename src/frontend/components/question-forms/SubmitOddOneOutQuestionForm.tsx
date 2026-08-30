import React from 'react';
import { useRouter } from 'next/navigation';

import { FieldArray, useFormikContext } from 'formik';
import { Plus, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { ObjectSchema } from 'yup';

import { Wizard, WizardStep } from '@/frontend/components/common/MultiStepComponents';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MySelect, MyTextInput, StyledErrorMessage } from '@/frontend/components/common/StyledFormComponents';
import { Button } from '@/frontend/components/ui/button';
import { SelectItem } from '@/frontend/components/ui/select';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { submitQuestionForm, type QuestionFormPayload } from '@/frontend/helpers/forms/submitQuestionForm';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, Locale, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { QuestionType } from '@/models/questions/question-type';
import { Topic } from '@/models/topic';

const messages = defineMessages('frontend.forms.submitQuestion.oddOneOut', {
  enterItems: 'All the proposals must be correct, except for one (the odd one out).',
  answerIdxLabel: 'What proposal is the odd one?',
});

const QUESTION_TYPE = QuestionType.ODD_ONE_OUT;

interface OOOItem {
  title: string;
  explanation: string;
}

const OOO_ITEMS_EXAMPLE: { en: OOOItem[]; fr: OOOItem[] } = {
  en: [
    {
      title: 'Man Bites Dog (🇧🇪, 1992)',
      explanation: 'Mockumentary about a serial killer played by Benoît Poelvoorde.',
    },
    {
      title: 'The Silence of The Lambs (🇺🇸, 1990)',
      explanation: 'Featuring the cannibalistic psychiatrist Hannibal Lecter, played by Anthony Hopkins.',
    },
    { title: 'Fear City: A Family-Style Comedy (🇫🇷, 1994)', explanation: 'A killer armed with a hammer and sickle.' },
    { title: 'Braindead (🇳🇿, 1992)', explanation: 'Horrific comedy with zombies, directed by Peter Jackson.' },
    { title: 'Seven (🇺🇸, 1995)', explanation: "What's in the box?" },
    { title: 'Hot Fuzz (🇬🇧, 2007)', explanation: 'The Neighbourhood Watch Alliance of Sandford.' },
    { title: 'Saw (🇺🇸, 2004)', explanation: "John Kramer a.k.a. 'Jigsaw'." },
    { title: 'The House That Jack Built (🇩🇰, 2018)', explanation: 'Architect by day, murderer by night.' },
    {
      title: 'High Tension (🇫🇷, 2003)',
      explanation: 'French slasher in which a serial killer massacres a family on a farm.',
    },
    { title: 'American Psycho (🇺🇸, 2000)', explanation: 'Patrick Bateman.' },
  ],
  fr: [
    {
      explanation: 'Faux documentaire belge sur un tueur en série, incarné par Benoît Poelvoorde',
      title: 'C’est arrivé près de chez vous (1992)',
    },
    {
      explanation: 'Met en scène le psychiatre cannibale Hannibal Lecter, incarné par Anthony Hopkins',
      title: 'Le silence des agneaux (1990)',
    },
    { explanation: "Un tueur armé d'un marteau et d'une faucille", title: 'La cité de la peur (1994)' },
    { explanation: 'Comédie horrifique avec des zombies, réalisée par Peter Jackson', title: 'Braindead (1992)' },
    { explanation: "Qu'y a-t-il dans la boîte?", title: 'Seven (1995)' },
    { title: 'Hot Fuzz (2007)', explanation: 'Simon Skinner' },
    { title: 'Saw (2004)', explanation: 'John Kramer, alias "Jigsaw"' },
    { title: 'The House That Jack Built (2018)', explanation: 'Architecte le jour, tueur en série la nuit' },
    {
      explanation: 'Slasher français dans lequel un tueur en série massacre une famille dans une ferme',
      title: 'Haute Tension (2003)',
    },
    { title: 'American Psycho (2000)', explanation: 'Patrick Bateman' },
  ],
};

const oddOneOutItemsSchema = () =>
  Yup.array()
    .of(
      Yup.object({
        title: stringSchema(OddOneOutQuestion.ITEM_TITLE_MAX_LENGTH),
        explanation: stringSchema(OddOneOutQuestion.ITEM_EXPLANATION_MAX_LENGTH),
      })
    )
    .min(OddOneOutQuestion.MIN_NUM_ITEMS, `There must be at least ${OddOneOutQuestion.MIN_NUM_ITEMS} items`)
    .max(OddOneOutQuestion.MAX_NUM_ITEMS, `There must be at most ${OddOneOutQuestion.MAX_NUM_ITEMS} items`)
    .required('Required.');

interface OOOFormValues {
  lang: string;
  topic: string;
  title: string;
  note: string;
  items: OOOItem[];
  answerIdx: number;
}

interface QuestionFormProps {
  userId?: string;
  questionToEdit?: Record<string, unknown>;
  inGameEditor?: boolean;
  inSubmitPage?: boolean;
  gameId?: string;
  roundId?: string;
  onDialogClose?: () => void;
}

export default function SubmitOddOneOutQuestionForm(props: QuestionFormProps) {
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitOOOQuestion, isSubmitting] = useAsyncAction(async (values: OOOFormValues) => {
    try {
      const { topic, lang, ...others } = values as typeof values & { topic: Topic; lang: Locale };
      const data: QuestionFormPayload = { type: QUESTION_TYPE, topic, lang, details: { ...others } };
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
              items:
                (q.items as OOOItem[]) || Array(OddOneOutQuestion.MIN_NUM_ITEMS).fill({ title: '', explanation: '' }),
              answerIdx: (q.answerIdx as number) ?? -1,
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              title: '',
              note: '',
              items: Array(OddOneOutQuestion.MIN_NUM_ITEMS).fill({ title: '', explanation: '' }),
              answerIdx: -1,
            }
      }
      onSubmit={async (values) => {
        await submitOOOQuestion(values as OOOFormValues);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
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
          title: stringSchema(OddOneOutQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(OddOneOutQuestion.NOTE_MAX_LENGTH, false),
        })}
      />

      {/* Step 2: Proposals */}
      <EnterItemsStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          items: oddOneOutItemsSchema(),
          answerIdx: Yup.number()
            .min(0, 'Required.')
            .max(OddOneOutQuestion.MAX_NUM_ITEMS - 1, 'Required.')
            .required('Required.'),
        })}
      />
    </Wizard>
  );
}

interface StepProps {
  onSubmit: () => void;
  validationSchema: ObjectSchema<Record<string, unknown>>;
  children?: React.ReactNode;
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
        placeholder="Which films feature one or more serial killers?"
        validationSchema={validationSchema}
        maxLength={OddOneOutQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.hintsRemarks)}
        name="note"
        type="text"
        placeholder="Hint: The odd one out is a zombie film."
        validationSchema={validationSchema}
        maxLength={OddOneOutQuestion.NOTE_MAX_LENGTH}
      />
    </WizardStep>
  );
}

function EnterItemsStep({ onSubmit, validationSchema }: StepProps) {
  const intl = useIntl();
  const formik = useFormikContext<OOOFormValues>();

  const values = formik.values;
  const errors = formik.errors;

  const TitleError = ({ index }: { index: number }) => {
    const itemErrors = errors.items as (Yup.ValidationError | undefined)[] | undefined;
    return (
      Array.isArray(itemErrors) &&
      itemErrors[index] &&
      (itemErrors[index] as unknown as { title?: string }).title && (
        <StyledErrorMessage>{(itemErrors[index] as unknown as { title: string }).title}</StyledErrorMessage>
      )
    );
  };

  const ExplanationError = ({ index }: { index: number }) => {
    const itemErrors = errors.items as (Yup.ValidationError | undefined)[] | undefined;
    return (
      Array.isArray(itemErrors) &&
      itemErrors[index] &&
      (itemErrors[index] as unknown as { explanation?: string }).explanation && (
        <StyledErrorMessage>{(itemErrors[index] as unknown as { explanation: string }).explanation}</StyledErrorMessage>
      )
    );
  };

  const exampleItems = intl.locale === 'fr' ? OOO_ITEMS_EXAMPLE['fr'] : OOO_ITEMS_EXAMPLE['en'];

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <p className="mb-4">
        {intl.formatMessage(globalMessages.numProposalsAllowed)}: {OddOneOutQuestion.MIN_NUM_ITEMS}-
        {OddOneOutQuestion.MAX_NUM_ITEMS}.
      </p>

      <p className="mb-4">{intl.formatMessage(messages.enterItems)}</p>

      <FieldArray name="items">
        {({ remove, push }) => (
          <>
            {values.items.length > 0 &&
              values.items.map((item, idx) => (
                <section key={idx} className="my-4 p-4 border-2 border-dashed border-gray-500 w-[500px]">
                  <span className="text-lg">
                    {intl.formatMessage(questionMessages.item)} #{idx + 1}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 />
                  </Button>

                  <MyTextInput
                    label={`${intl.formatMessage(globalMessages.proposal)} #${idx + 1}`}
                    name={`items.${idx}.title`}
                    type="text"
                    placeholder={exampleItems[idx % exampleItems.length].title}
                    validationSchema={validationSchema}
                    maxLength={OddOneOutQuestion.ITEM_TITLE_MAX_LENGTH}
                    fieldType="object_in_array"
                  />
                  <TitleError index={idx} />

                  <MyTextInput
                    label={`${intl.formatMessage(globalMessages.explanation)} #${idx + 1}`}
                    name={`items.${idx}.explanation`}
                    type="text"
                    placeholder={exampleItems[idx % exampleItems.length].explanation}
                    validationSchema={validationSchema}
                    maxLength={OddOneOutQuestion.ITEM_EXPLANATION_MAX_LENGTH}
                    fieldType="object_in_array"
                  />
                  <ExplanationError index={idx} />
                </section>
              ))}
            <Button variant="outline" onClick={() => push({ title: '', explanation: '' })}>
              <Plus className="mr-2 size-4" />
              {intl.formatMessage(questionMessages.addItem)}
            </Button>
          </>
        )}
      </FieldArray>

      {typeof errors.items === 'string' && <StyledErrorMessage>{errors.items}</StyledErrorMessage>}

      {!errors.items && formik.touched.items && (
        <MySelect
          label={intl.formatMessage(messages.answerIdxLabel)}
          name="answerIdx"
          validationSchema={validationSchema}
          onChange={(value: string) => formik.setFieldValue('answerIdx', parseInt(value, 10))}
        >
          <SelectItem value="">{intl.formatMessage(questionMessages.selectProposal)}</SelectItem>
          {values.items.map((item, index) => (
            <SelectItem key={index} value={String(index)}>
              {item.title}
            </SelectItem>
          ))}
        </MySelect>
      )}
    </WizardStep>
  );
}
