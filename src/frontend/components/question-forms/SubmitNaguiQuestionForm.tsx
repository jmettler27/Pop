import React from 'react';
import { useRouter } from 'next/navigation';

import { Field, FieldArray, useField, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { ObjectSchema } from 'yup';

import { Wizard, WizardStep } from '@/frontend/components/common/MultiStepComponents';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MySelect, MyTextInput, StyledErrorMessage } from '@/frontend/components/common/StyledFormComponents';
import { SelectItem } from '@/frontend/components/ui/select';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { submitQuestionForm, type QuestionFormPayload } from '@/frontend/helpers/forms/submitQuestionForm';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, Locale, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { NaguiQuestion } from '@/models/questions/nagui';
import { QuestionType } from '@/models/questions/question-type';
import { Topic } from '@/models/topic';

const messages = defineMessages('frontend.forms.submitQuestion.nagui', {
  duoIdxLabel: 'What other proposal do you want for the duo?',
});

const QUESTION_TYPE = QuestionType.NAGUI;

const NAGUI_CHOICES_EXAMPLE = ['101', '303', '404', '506'];

interface NaguiFormValues {
  lang: string;
  topic: string;
  source: string;
  title: string;
  note: string;
  explanation: string;
  choices: string[];
  answerIdx: number;
  duoIdx: number;
}

interface QuestionFormProps {
  questionToEdit?: Record<string, unknown>;
  inGameEditor?: boolean;
  inSubmitPage?: boolean;
  gameId?: string;
  roundId?: string;
  onDialogClose?: () => void;
}

export default function SubmitNaguiQuestionForm(props: QuestionFormProps) {
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitNaguiQuestion, isSubmitting] = useAsyncAction(async (values: NaguiFormValues) => {
    try {
      const { topic, lang, duoIdx, ...rest } = values as typeof values & { topic: Topic; lang: Locale };
      const data: QuestionFormPayload = { type: QUESTION_TYPE, topic, lang, details: { duoIdx, ...rest } };
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
              source: (q.source as string) || '',
              title: (q.title as string) || '',
              note: (q.note as string) || '',
              explanation: (q.explanation as string) || '',
              choices: (q.choices as string[]) || Array(NaguiQuestion.MAX_CHOICES).fill(''),
              answerIdx: (q.answerIdx as number) ?? -1,
              duoIdx: (q.duoIdx as number) ?? -1,
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              source: '',
              title: '',
              note: '',
              explanation: '',
              choices: Array(NaguiQuestion.MAX_CHOICES).fill(''),
              answerIdx: -1,
              duoIdx: -1,
              // imageFiles: '',
              // audioFiles: ''
            }
      }
      onSubmit={async (values) => {
        await submitNaguiQuestion(values as NaguiFormValues);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose?.();
        }
      }}
      isSubmitting={isSubmitting}
    >
      <GeneralInfoStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          lang: localeSchema(),
          topic: topicSchema(),
          source: stringSchema(NaguiQuestion.SOURCE_MAX_LENGTH, false),
          title: stringSchema(NaguiQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(NaguiQuestion.NOTE_MAX_LENGTH, false),
        })}
      />

      <EnterChoicesStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          choices: Yup.array()
            .of(stringSchema(NaguiQuestion.CHOICE_MAX_LENGTH))
            .length(NaguiQuestion.MAX_CHOICES, `There must be exactly ${NaguiQuestion.MAX_CHOICES} choices`)
            .required('Required.'),
          answerIdx: Yup.number()
            .min(0, 'Required.')
            .max(NaguiQuestion.MAX_CHOICES - 1, 'Required.')
            .required('Required.'),
          explanation: stringSchema(NaguiQuestion.EXPLANATION_MAX_LENGTH, false),
          duoIdx: Yup.number()
            .min(0, 'Required.')
            .max(NaguiQuestion.MAX_CHOICES - 1, 'Required.')
            .required('Required.'),
        })}
      >
        {/* TODO */}
      </EnterChoicesStep>
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
        label={intl.formatMessage(questionMessages.questionSource)}
        name="source"
        type="text"
        placeholder="The Matrix"
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.SOURCE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.questionTitle)}
        name="title"
        type="text"
        placeholder="What is Neo's room number?"
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.hintsRemarks)}
        name="note"
        type="text"
        placeholder=""
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.NOTE_MAX_LENGTH}
      />
    </WizardStep>
  );
}

function EnterChoicesStep({ onSubmit, validationSchema }: StepProps) {
  const intl = useIntl();
  const formik = useFormikContext<NaguiFormValues>();

  const values = formik.values;
  const errors = formik.errors;

  const ChoiceError = ({ index }: { index: number }) => {
    const [, meta] = useField(`choices.${index}`);
    return (
      typeof errors.choices === 'object' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <FieldArray name="choices">
        {() => (
          <section className="my-4 p-4 border-2 border-dashed border-gray-500 w-[500px]">
            {values.choices.map((_item, index) => (
              <div key={index}>
                <label htmlFor={`choices.${index}`}>
                  {NaguiQuestion.CHOICES[index]} ({values.choices[index].length}/{NaguiQuestion.CHOICE_MAX_LENGTH})
                </label>
                <Field name={`choices.${index}`} type="text" placeholder={NAGUI_CHOICES_EXAMPLE[index]} />
                <ChoiceError index={index} />
              </div>
            ))}
          </section>
        )}
      </FieldArray>
      {typeof errors.choices === 'string' && <StyledErrorMessage>{errors.choices}</StyledErrorMessage>}

      <MySelect
        label={intl.formatMessage(globalMessages.correctProposalQuestion)}
        name="answerIdx"
        validationSchema={validationSchema}
        onChange={(value: string) => formik.setFieldValue('answerIdx', parseInt(value, 10))}
      >
        <SelectItem value="">{intl.formatMessage(questionMessages.selectProposal)}</SelectItem>
        {values.choices.map((choice, index) => (
          <SelectItem key={index} value={String(index)}>
            {NaguiQuestion.CHOICES[index]}. {choice}
          </SelectItem>
        ))}
      </MySelect>

      <MyTextInput
        label={intl.formatMessage(questionMessages.explanation)}
        name="explanation"
        type="text"
        placeholder="101 is an allusion to Neo's destiny as the One."
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.EXPLANATION_MAX_LENGTH}
      />

      {values.answerIdx >= 0 && (
        <MySelect
          label={intl.formatMessage(messages.duoIdxLabel)}
          name="duoIdx"
          validationSchema={validationSchema}
          onChange={(value: string) => formik.setFieldValue('duoIdx', parseInt(value, 10))}
        >
          <SelectItem value="">{intl.formatMessage(questionMessages.selectProposal)}</SelectItem>
          {values.choices.map(
            (choice, index) =>
              index !== values.answerIdx && (
                <SelectItem key={index} value={String(index)}>
                  {NaguiQuestion.CHOICES[index]}. {choice}
                </SelectItem>
              )
          )}
        </MySelect>
      )}
    </WizardStep>
  );
}
