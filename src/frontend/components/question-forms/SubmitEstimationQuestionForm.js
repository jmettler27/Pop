import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Form, Formik, useField, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MySelect, MyTextInput, StyledLabel } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import { EstimationQuestion } from '@/models/questions/Estimation';
import { QuestionType } from '@/models/questions/QuestionType';

const { AnswerType } = EstimationQuestion;

const messages = defineMessages('frontend.forms.submitQuestion.estimation', {
  answerTypeLabel: 'Type of answer',
  answerTypeInteger: 'Integer (e.g. 5)',
  answerTypeDecimal: 'Decimal (e.g. 0.5)',
  answerTypeYear: 'Year (e.g. 2009)',
  answerTypeDate: 'Precise date (e.g. 06.25.2009)',
  answerIntegerLabel: 'Answer (integer)',
  answerDecimalLabel: 'Answer (decimal)',
  answerYearLabel: 'Answer (year)',
  answerDateLabel: 'Answer (date)',
});

const answerSchema = () =>
  Yup.string()
    .required('Required.')
    .when('answerType', ([answerType], schema) => {
      switch (answerType) {
        case AnswerType.INTEGER:
          return schema
            .matches(/^-?\d+$/, 'Must be a whole number')
            .test(
              'integer-range',
              `Must be between ${EstimationQuestion.INTEGER_MIN} and ${EstimationQuestion.INTEGER_MAX}`,
              (v) => {
                const n = parseInt(v, 10);
                return !isNaN(n) && n >= EstimationQuestion.INTEGER_MIN && n <= EstimationQuestion.INTEGER_MAX;
              }
            );
        case AnswerType.DECIMAL:
          return schema
            .matches(/^-?\d+(\.\d+)?$/, 'Must be a valid number (e.g. 3.14)')
            .test(
              'decimal-range',
              `Must be between ${EstimationQuestion.DECIMAL_MIN} and ${EstimationQuestion.DECIMAL_MAX}`,
              (v) => {
                const n = parseFloat(v);
                return !isNaN(n) && n >= EstimationQuestion.DECIMAL_MIN && n <= EstimationQuestion.DECIMAL_MAX;
              }
            );
        case AnswerType.YEAR:
          return schema
            .matches(/^\d{1,4}$/, 'Must be a valid year')
            .test('year-range', 'Must be between 1 and 9999', (v) => {
              const n = parseInt(v, 10);
              return !isNaN(n) && n >= EstimationQuestion.YEAR_MIN && n <= EstimationQuestion.YEAR_MAX;
            });
        case AnswerType.DATE:
          return schema.matches(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date');
        default:
          return schema;
      }
    });

// Resets `answer` to '' whenever `answerType` changes, so stale values don't leak across types.
// Skips initial mount so existing questions keep their saved answer on edit.
function AnswerTypeWatcher() {
  const { values, setFieldValue } = useFormikContext();
  const answerType = values.answerType;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setFieldValue('answer', '');
  }, [answerType]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function AnswerInput({ answerType, validationSchema }) {
  const intl = useIntl();
  const { values, setFieldValue } = useFormikContext();
  const [, meta] = useField('answer');

  if (answerType === AnswerType.YEAR) {
    return (
      <MyTextInput
        label={intl.formatMessage(messages.answerYearLabel)}
        name="answer"
        type="number"
        step="1"
        min={EstimationQuestion.YEAR_MIN}
        max={EstimationQuestion.YEAR_MAX}
        placeholder="2009"
        validationSchema={validationSchema}
      />
    );
  }

  if (answerType === AnswerType.DATE) {
    return (
      <>
        <StyledLabel htmlFor="answer">{intl.formatMessage(messages.answerDateLabel)} *</StyledLabel>
        <input
          id="answer"
          name="answer"
          type="date"
          className="text-input text-xs sm:text-sm md:text-base"
          min={EstimationQuestion.DATE_MIN}
          max={EstimationQuestion.DATE_MAX}
          lang={intl.locale}
          value={values.answer || ''}
          onChange={(e) => setFieldValue('answer', e.target.value)}
          onBlur={() => {}}
        />
        {meta.touched && meta.error && <div className="error text-xs sm:text-sm">{meta.error}</div>}
      </>
    );
  }

  // INTEGER or DECIMAL
  const isDecimal = answerType === AnswerType.DECIMAL;
  return (
    <MyTextInput
      label={intl.formatMessage(isDecimal ? messages.answerDecimalLabel : messages.answerIntegerLabel)}
      name="answer"
      type="number"
      step={isDecimal ? 'any' : '1'}
      placeholder={isDecimal ? '0.5' : '5'}
      validationSchema={validationSchema}
    />
  );
}

export default function SubmitEstimationQuestionForm({ userId, ...props }) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit;

  const [submitEstimationQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, ...others } = values;
      if (q) {
        await editQuestion({ details: { ...others }, type: QuestionType.ESTIMATION, topic, lang }, q.id);
      } else {
        const questionId = await submitQuestion(
          { details: { ...others }, type: QuestionType.ESTIMATION, topic, lang },
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

  const validationSchema = Yup.object({
    lang: localeSchema(),
    topic: topicSchema(),
    source: stringSchema(EstimationQuestion.SOURCE_MAX_LENGTH, false),
    title: stringSchema(EstimationQuestion.TITLE_MAX_LENGTH),
    note: stringSchema(EstimationQuestion.NOTE_MAX_LENGTH, false),
    answerType: Yup.string().oneOf(Object.values(AnswerType)).required('Required.'),
    answer: answerSchema(),
    explanation: stringSchema(EstimationQuestion.EXPLANATION_MAX_LENGTH, false),
  });

  const initialAnswerType = q?.answerType || AnswerType.INTEGER;

  return (
    <Formik
      initialValues={
        q
          ? {
              lang: q.lang || DEFAULT_LOCALE,
              topic: q.topic || '',
              source: q.source || '',
              title: q.title || '',
              note: q.note || '',
              answerType: initialAnswerType,
              answer: q.answer || '',
              explanation: q.explanation || '',
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              source: '',
              title: '',
              note: '',
              answerType: AnswerType.INTEGER,
              answer: '',
              explanation: '',
            }
      }
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={async (values) => {
        await submitEstimationQuestion(values);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
    >
      {({ values }) => (
        <Form>
          <AnswerTypeWatcher />

          <SelectLanguage name="lang" validationSchema={validationSchema} />

          <SelectQuestionTopic name="topic" validationSchema={validationSchema} />

          <MyTextInput
            label={intl.formatMessage(questionMessages.questionSource)}
            name="source"
            type="text"
            placeholder="Minecraft"
            validationSchema={validationSchema}
            maxLength={EstimationQuestion.SOURCE_MAX_LENGTH}
          />

          <MyTextInput
            label={intl.formatMessage(questionMessages.questionTitle)}
            name="title"
            type="text"
            placeholder="How much sand is needed to craft sandstone?"
            validationSchema={validationSchema}
            maxLength={EstimationQuestion.TITLE_MAX_LENGTH}
          />

          <MyTextInput
            label={intl.formatMessage(questionMessages.hintsRemarks)}
            name="note"
            type="text"
            validationSchema={validationSchema}
            maxLength={EstimationQuestion.NOTE_MAX_LENGTH}
          />

          <MySelect
            label={intl.formatMessage(messages.answerTypeLabel)}
            name="answerType"
            validationSchema={validationSchema}
          >
            <option value={AnswerType.INTEGER}>{intl.formatMessage(messages.answerTypeInteger)}</option>
            <option value={AnswerType.DECIMAL}>{intl.formatMessage(messages.answerTypeDecimal)}</option>
            <option value={AnswerType.YEAR}>{intl.formatMessage(messages.answerTypeYear)}</option>
            <option value={AnswerType.DATE}>{intl.formatMessage(messages.answerTypeDate)}</option>
          </MySelect>

          <AnswerInput answerType={values.answerType} validationSchema={validationSchema} />

          <MyTextInput
            label={intl.formatMessage(questionMessages.explanation)}
            name="explanation"
            type="text"
            validationSchema={validationSchema}
            maxLength={EstimationQuestion.EXPLANATION_MAX_LENGTH}
          />

          <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
        </Form>
      )}
    </Formik>
  );
}
