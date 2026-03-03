import { BasicQuestion } from '@/backend/models/questions/Basic';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { messages as questionMessages } from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useIntl } from 'react-intl';

import { stringSchema } from '@/frontend/utils/forms/forms';

import { MyTextInput } from '@/frontend/components/forms/StyledFormComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';

import { useRouter } from 'next/navigation';
import * as Yup from 'yup';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { Form, Formik } from 'formik';

export default function SubmitBasicQuestionForm({ userId, ...props }) {
  const intl = useIntl();
  const router = useRouter();

  const [submitBasicQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, ...others } = values;
      const questionId = await submitQuestion(
        {
          details: { ...others },
          type: QuestionType.BASIC,
          topic,
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

  const validationSchema = Yup.object({
    lang: localeSchema(),
    topic: topicSchema(),
    source: stringSchema(BasicQuestion.SOURCE_MAX_LENGTH, false),
    title: stringSchema(BasicQuestion.TITLE_MAX_LENGTH),
    note: stringSchema(BasicQuestion.NOTE_MAX_LENGTH, false),
    answer: stringSchema(BasicQuestion.ANSWER_MAX_LENGTH),
    explanation: stringSchema(BasicQuestion.EXPLANATION_MAX_LENGTH, false),
  });

  return (
    <Formik
      initialValues={{
        lang: DEFAULT_LOCALE,
        topic: '',
        source: '',
        title: '',
        note: '',
        answer: '',
        explanation: '',
      }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        await submitBasicQuestion(values);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
    >
      <Form>
        <SelectLanguage name="lang" validationSchema={validationSchema} />

        <SelectQuestionTopic name="topic" validationSchema={validationSchema} />

        <MyTextInput
          label={intl.formatMessage(questionMessages.questionSource)}
          name="source"
          type="text"
          placeholder="Minecraft"
          validationSchema={validationSchema}
          maxLength={BasicQuestion.SOURCE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(questionMessages.questionTitle)}
          name="title"
          type="text"
          placeholder="How much sand is needed to craft sandstone?"
          validationSchema={validationSchema}
          maxLength={BasicQuestion.TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(questionMessages.hintsRemarks)}
          name="note"
          type="text"
          // placeholder={MCQ_NOTE_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={BasicQuestion.NOTE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(questionMessages.answer)}
          name="answer"
          type="text"
          placeholder="4"
          validationSchema={validationSchema}
          maxLength={BasicQuestion.ANSWER_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(questionMessages.explanation)}
          name="explanation"
          type="text"
          // placeholder={MCQ_EXPLANATION_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={BasicQuestion.EXPLANATION_MAX_LENGTH}
        />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
      </Form>
    </Formik>
  );
}
