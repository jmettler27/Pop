import { QuestionType } from '@/backend/models/questions/QuestionType';
import { MCQQuestion } from '@/backend/models/questions/MCQ';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { messages as questionMessages } from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { stringSchema } from '@/frontend/utils/forms/forms';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.submitQuestion.mcq', {
  addChoice: 'Add choice',
  answerIdxLabel: 'What proposal is the correct one ?',
});

import { useRouter } from 'next/navigation';

import React from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect, StyledErrorMessage } from '@/frontend/components/forms/StyledFormComponents';
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

const QUESTION_TYPE = QuestionType.MCQ;

const MCQ_CHOICES_EXAMPLE = ['101', '303', '404', '506'];

export default function SubmitMCQForm({ userId, ...props }) {
  const router = useRouter();

  const [submitMCQ, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, duoIdx, ...rest } = values;
      const details = rest;
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
    } catch (error) {
      console.error('Failed to submit your question:', error);
    }
  });

  return (
    <Wizard
      initialValues={{
        lang: DEFAULT_LOCALE,
        topic: '',
        source: '',
        title: '',
        note: '',
        explanation: '',
        choices: Array(MCQQuestion.MAX_NUM_CHOICES).fill(''),
        answerIdx: -1,
        // imageFiles: '',
        // audioFiles: ''
      }}
      onSubmit={async (values) => {
        await submitMCQ(values);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose();
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
            .min(MCQQuestion.MIN_NUM_CHOICES, `There must be at least ${MCQQuestion.MIN_NUM_CHOICES} choices`)
            .max(MCQQuestion.MAX_NUM_CHOICES, `There must be at most ${MCQQuestion.MAX_NUM_CHOICES} choices`),
          answerIdx: Yup.number()
            .min(0, 'Required.')
            .max(MCQQuestion.MAX_NUM_CHOICES - 1, 'Required.')
            .required('Required.'),
          explanation: stringSchema(MCQQuestion.EXPLANATION_MAX_LENGTH, false),
        })}
      >
        {/* TODO */}
      </EnterChoicesStep>
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
        // label={`${stringRequiredAsterisk(validationSchema, 'source')}To what work is this question related to? ${numCharsIndicator(values['source'], MCQ_SOURCE_MAX_LENGTH)}`}
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

import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { IconButton } from '@mui/material';

function EnterChoicesStep({ onSubmit, validationSchema }) {
  const intl = useIntl();
  const formik = useFormikContext();

  const values = formik.values;
  const errors = formik.errors;

  const ChoiceArrayErrors = () =>
    typeof errors.choices === 'string' && <StyledErrorMessage>{errors.choices}</StyledErrorMessage>;

  const ChoiceError = ({ index }) => {
    const [field, meta] = useField(`choices.${index}`);
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
                  {MCQQuestion.CHOICES[index]} ({values.choices[index].length}/{MCQQuestion.CHOICE_MAX_LENGTH})
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
        label={intl.formatMessage(messages.answerIdxLabel)}
        name="answerIdx"
        validationSchema={validationSchema}
        onChange={(e) => formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))}
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
