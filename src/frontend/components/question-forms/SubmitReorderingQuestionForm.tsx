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
import { MyTextInput, StyledErrorMessage } from '@/frontend/components/common/StyledFormComponents';
import { Button } from '@/frontend/components/ui/button';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { submitQuestionForm, type QuestionFormPayload } from '@/frontend/helpers/forms/submitQuestionForm';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, Locale, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/question-type';
import { ReorderingQuestion } from '@/models/questions/reordering';
import { Topic } from '@/models/topic';

const QUESTION_TYPE = QuestionType.REORDERING;

const REORDERING_TITLE_EXAMPLE: Record<string, string> = {
  en: 'Which films feature one or more serial killers?',
  fr: 'Quels films mettent en scène un ou plusieurs tueurs en série?',
};
const REORDERING_NOTE_EXAMPLE: Record<string, string> = {
  en: 'Hint: The odd one out is a zombie film.',
  fr: "Indice: L'intrus est un film de zombies.",
};

interface ReorderingItem {
  title: string;
  explanation: string;
}

const REORDERING_ITEMS_EXAMPLE: { en: ReorderingItem[]; fr: ReorderingItem[] } = {
  en: [
    { title: "Philosopher's Stone", explanation: '' },
    { title: 'Chamber of Secrets', explanation: '' },
    { title: 'Prisoner of Azkaban', explanation: '' },
    { title: 'Goblet of Fire', explanation: '' },
    { title: 'Order of the Phoenix', explanation: '' },
    { title: 'Half-Blood Prince', explanation: '' },
    { title: 'Deathly Hallows', explanation: '' },
  ],
  fr: [
    { title: "L'école des sorciers", explanation: '' },
    { title: 'La chambre des sorciers', explanation: '' },
    { title: "Le prisonnier d'Azkaban", explanation: '' },
    { title: 'La coupe de feu', explanation: '' },
    { title: "L'ordre du phénix", explanation: '' },
    { title: "Le prisonnier d'Azkaban", explanation: '' },
    { title: 'Les reliques de la nort', explanation: '' },
  ],
};

const reorderingItemsSchema = () =>
  Yup.array()
    .of(
      Yup.object({
        title: stringSchema(ReorderingQuestion.ITEM_TITLE_MAX_LENGTH),
        explanation: stringSchema(ReorderingQuestion.ITEM_EXPLANATION_MAX_LENGTH, false),
      })
    )
    .min(ReorderingQuestion.MIN_NUM_ITEMS, `There must be at least ${ReorderingQuestion.MIN_NUM_ITEMS} items`)
    .max(ReorderingQuestion.MAX_NUM_ITEMS, `There must be at most ${ReorderingQuestion.MAX_NUM_ITEMS} items`);

interface ReorderingFormValues {
  lang: string;
  topic: string;
  title: string;
  note: string;
  items: ReorderingItem[];
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

export default function SubmitReorderingQuestionForm(props: QuestionFormProps) {
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitReorderingQuestion, isSubmitting] = useAsyncAction(async (values: ReorderingFormValues) => {
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
                (q.items as ReorderingItem[]) ||
                Array(ReorderingQuestion.MIN_NUM_ITEMS).fill({ title: '', explanation: '' }),
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              title: '',
              note: '',
              items: Array(ReorderingQuestion.MIN_NUM_ITEMS).fill({ title: '', explanation: '' }),
            }
      }
      onSubmit={async (values) => {
        await submitReorderingQuestion(values as ReorderingFormValues);
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
          title: stringSchema(ReorderingQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(ReorderingQuestion.NOTE_MAX_LENGTH, false),
        })}
      />

      {/* Step 2: Proposals */}
      <EnterItemsStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          items: reorderingItemsSchema(),
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
        placeholder={intl.locale === 'fr' ? REORDERING_TITLE_EXAMPLE['fr'] : REORDERING_TITLE_EXAMPLE['en']}
        validationSchema={validationSchema}
        maxLength={ReorderingQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.hintsRemarks)}
        name="note"
        type="text"
        placeholder={intl.locale === 'fr' ? REORDERING_NOTE_EXAMPLE['fr'] : REORDERING_NOTE_EXAMPLE['en']}
        validationSchema={validationSchema}
        maxLength={ReorderingQuestion.NOTE_MAX_LENGTH}
      />
    </WizardStep>
  );
}

function EnterItemsStep({ onSubmit, validationSchema }: StepProps) {
  const intl = useIntl();
  const formik = useFormikContext<ReorderingFormValues>();

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

  const exampleItems = intl.locale === 'fr' ? REORDERING_ITEMS_EXAMPLE['fr'] : REORDERING_ITEMS_EXAMPLE['en'];

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <p className="mb-4">
        {intl.formatMessage(globalMessages.numProposalsAllowed)}: {ReorderingQuestion.MIN_NUM_ITEMS}-
        {ReorderingQuestion.MAX_NUM_ITEMS}.
      </p>

      <FieldArray name="items">
        {({ remove, push }) => (
          <>
            {values.items.length > 0 &&
              values.items.map((_item, idx) => (
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
                    maxLength={ReorderingQuestion.ITEM_TITLE_MAX_LENGTH}
                    fieldType="object_in_array"
                  />
                  <TitleError index={idx} />

                  <MyTextInput
                    label={`${intl.formatMessage(globalMessages.explanation)} #${idx + 1}`}
                    name={`items.${idx}.explanation`}
                    type="text"
                    placeholder={exampleItems[idx % exampleItems.length].explanation}
                    validationSchema={validationSchema}
                    maxLength={ReorderingQuestion.ITEM_EXPLANATION_MAX_LENGTH}
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
    </WizardStep>
  );
}
