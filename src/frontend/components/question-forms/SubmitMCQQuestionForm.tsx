import React from 'react';
import { useRouter } from 'next/navigation';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { ObjectSchema } from 'yup';

import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import { Wizard, WizardStep } from '@/frontend/components/common/MultiStepComponents';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MySelect, MyTextInput, StyledErrorMessage } from '@/frontend/components/common/StyledFormComponents';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.forms.submitQuestion.mcq', {
  addChoice: 'Add choice',
});

const QUESTION_TYPE = QuestionType.MCQ;

const MCQ_CHOICES_EXAMPLE = ['101', '303', '404', '506'];

interface MCQFormValues {
  lang: string;
  topic: string;
  source: string;
  title: string;
  note: string;
  explanation: string;
  choices: string[];
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

export default function SubmitMCQForm({ userId, ...props }: QuestionFormProps) {
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitMCQ, isSubmitting] = useAsyncAction(async (values: MCQFormValues) => {
    try {
      const { topic, lang, ...rest } = values;
      const details = rest;
      if (q) {
        await editQuestion({ details, type: QUESTION_TYPE, topic, lang }, q.id as string);
      } else {
        const questionId = await submitQuestion(
          {
            details,
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
              source: (q.source as string) || '',
              title: (q.title as string) || '',
              note: (q.note as string) || '',
              explanation: (q.explanation as string) || '',
              choices: (q.choices as string[]) || Array(MCQQuestion.MAX_CHOICES).fill(''),
              answerIdx: (q.answerIdx as number) ?? -1,
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              source: '',
              title: '',
              note: '',
              explanation: '',
              choices: Array(MCQQuestion.MAX_CHOICES).fill(''),
              answerIdx: -1,
              // imageFiles: '',
              // audioFiles: ''
            }
      }
      onSubmit={async (values) => {
        await submitMCQ(values as MCQFormValues);
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
          source: stringSchema(MCQQuestion.SOURCE_MAX_LENGTH, false),
          title: stringSchema(MCQQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(MCQQuestion.NOTE_MAX_LENGTH, false),
        })}
      />

      <EnterChoicesStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          choices: Yup.array()
            .of(stringSchema(MCQQuestion.CHOICE_MAX_LENGTH))
            .min(MCQQuestion.MIN_CHOICES, `There must be at least ${MCQQuestion.MIN_CHOICES} choices`)
            .max(MCQQuestion.MAX_CHOICES, `There must be at most ${MCQQuestion.MAX_CHOICES} choices`),
          answerIdx: Yup.number()
            .min(0, 'Required.')
            .max(MCQQuestion.MAX_CHOICES - 1, 'Required.')
            .required('Required.'),
          explanation: stringSchema(MCQQuestion.EXPLANATION_MAX_LENGTH, false),
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
        maxLength={MCQQuestion.SOURCE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.questionTitle)}
        name="title"
        type="text"
        placeholder="What is Neo's room number?"
        validationSchema={validationSchema}
        maxLength={MCQQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.hintsRemarks)}
        name="note"
        type="text"
        placeholder=""
        validationSchema={validationSchema}
        maxLength={MCQQuestion.NOTE_MAX_LENGTH}
      />
    </WizardStep>
  );
}

function EnterChoicesStep({ onSubmit, validationSchema }: StepProps) {
  const intl = useIntl();
  const formik = useFormikContext<MCQFormValues>();

  const values = formik.values;
  const errors = formik.errors;

  const ChoiceArrayErrors = () =>
    typeof errors.choices === 'string' && <StyledErrorMessage>{errors.choices}</StyledErrorMessage>;

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
        {({ remove, push }) => (
          <div>
            {values.choices.map((clue, index) => (
              <div className="row" key={index}>
                <label htmlFor={`choices.${index}`}>
                  {MCQQuestion.CHOICES[index]} ({clue.length}/{MCQQuestion.CHOICE_MAX_LENGTH})
                </label>
                <Field name={'choices.' + index} placeholder={MCQ_CHOICES_EXAMPLE[index]} type="text" />
                <ChoiceError index={index} />

                <IconButton color="error" onClick={() => remove(index)}>
                  <DeleteIcon />
                </IconButton>

                <ChoiceError index={index} />
              </div>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => push('')}>
              {intl.formatMessage(messages.addChoice)}
            </Button>
          </div>
        )}
      </FieldArray>
      <ChoiceArrayErrors />

      <MySelect
        label={intl.formatMessage(globalMessages.correctProposalQuestion)}
        name="answerIdx"
        validationSchema={validationSchema}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))
        }
      >
        <option value="">{intl.formatMessage(questionMessages.selectProposal)}</option>
        {values.choices.map((choice, index) => (
          <option key={index} value={index}>
            {MCQQuestion.CHOICES[index]}. {choice}
          </option>
        ))}
      </MySelect>

      <MyTextInput
        label={intl.formatMessage(questionMessages.explanation)}
        name="explanation"
        type="text"
        placeholder="101 is an allusion to Neo's destiny as the One."
        validationSchema={validationSchema}
        maxLength={MCQQuestion.EXPLANATION_MAX_LENGTH}
      />
    </WizardStep>
  );
}
