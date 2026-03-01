import { QuestionType } from '@/backend/models/questions/QuestionType';
import { NaguiQuestion } from '@/backend/models/questions/Nagui';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { messages as questionMessages } from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { stringSchema } from '@/frontend/utils/forms/forms';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.submitQuestion.nagui', {
  answerIdxLabel: 'What proposal is the correct one ?',
  duoIdxLabel: 'What other proposal do you want for the duo?',
});

import { MyTextInput, MySelect, StyledErrorMessage } from '@/frontend/components/forms/StyledFormComponents';
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

import { useRouter } from 'next/navigation';

import React from 'react';
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import Box from '@mui/system/Box';

const QUESTION_TYPE = QuestionType.NAGUI;

const NAGUI_CHOICES_EXAMPLE = ['101', '303', '404', '506'];

export default function SubmitNaguiQuestionForm({ userId, ...props }) {
  const router = useRouter();

  const [submitNaguiQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, duoIdx, ...rest } = values;
      const details = { duoIdx, ...rest };
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
        choices: Array(NaguiQuestion.MAX_NUM_CHOICES).fill(''),
        answerIdx: -1,
        duoIdx: -1,
        // imageFiles: '',
        // audioFiles: ''
      }}
      onSubmit={async (values) => {
        await submitNaguiQuestion(values);
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
            .length(NaguiQuestion.MAX_NUM_CHOICES, `There must be exactly ${NaguiQuestion.MAX_NUM_CHOICES} choices`)
            .required('Required.'),
          answerIdx: Yup.number()
            .min(0, 'Required.')
            .max(NaguiQuestion.MAX_NUM_CHOICES - 1, 'Required.')
            .required('Required.'),
          explanation: stringSchema(NaguiQuestion.EXPLANATION_MAX_LENGTH, false),
          duoIdx: Yup.number()
            .min(0, 'Required.')
            .max(NaguiQuestion.MAX_NUM_CHOICES - 1, 'Required.')
            .required('Required.'),
          // .test(
          //     "same-as-answer",
          //     "Must be different that the answer",
          //     () => {
          //         return this.parent.answerIdx !== this.parent.duoIdx
          //     })
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
        // label={`${stringRequiredAsterisk(validationSchema, 'source')}To what work is this question related to? ${numCharsIndicator(values['source'], NAGUI_SOURCE_MAX_LENGTH)}`}
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
        <Box component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
          {values.choices.map((_item, index) => (
            <div key={index}>
              <label htmlFor={`choices.${index}`}>
                {NaguiQuestion.CHOICES[index]} ({values.choices[index].length}/{NaguiQuestion.CHOICE_MAX_LENGTH})
              </label>
              <Field name={`choices.${index}`} type="text" placeholder={NAGUI_CHOICES_EXAMPLE[index]} />
              <ChoiceError index={index} />
            </div>
          ))}
        </Box>
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
            {NaguiQuestion.CHOICES[index]}. {choice}
          </option>
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
          onChange={(e) => formik.setFieldValue('duoIdx', parseInt(e.target.value, 10))}
        >
          <option value="">{intl.formatMessage(questionMessages.selectProposal)}</option>
          {values.choices.map(
            (choice, index) =>
              index !== values.answerIdx && (
                <option key={index} value={index}>
                  {NaguiQuestion.CHOICES[index]}. {choice}
                </option>
              )
          )}
        </MySelect>
      )}
    </WizardStep>
  );
}
