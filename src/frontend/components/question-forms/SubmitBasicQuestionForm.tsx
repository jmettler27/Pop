import { useRouter } from 'next/navigation';

import { Form, Formik } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MyTextInput } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import { BasicQuestion } from '@/models/questions/basic';
import { QuestionType } from '@/models/questions/question-type';

interface QuestionFormProps {
  userId?: string;
  questionToEdit?: Record<string, unknown>;
  inGameEditor?: boolean;
  inSubmitPage?: boolean;
  gameId?: string;
  roundId?: string;
  onDialogClose?: () => void;
}

export default function SubmitBasicQuestionForm({ userId, ...props }: QuestionFormProps) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit as Record<string, string> | undefined;

  const [submitBasicQuestion, isSubmitting] = useAsyncAction(async (values: Record<string, string>) => {
    try {
      const { topic, lang, ...others } = values;
      if (q) {
        await editQuestion({ details: { ...others }, type: QuestionType.BASIC, topic, lang }, q.id);
      } else {
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
      initialValues={
        q
          ? {
              lang: q.lang || DEFAULT_LOCALE,
              topic: q.topic || '',
              source: q.source || '',
              title: q.title || '',
              note: q.note || '',
              answer: q.answer || '',
              explanation: q.explanation || '',
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              source: '',
              title: '',
              note: '',
              answer: '',
              explanation: '',
            }
      }
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={async (values) => {
        await submitBasicQuestion(values);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose?.();
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
