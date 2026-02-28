import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ImageQuestion } from '@/backend/models/questions/Image';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { messages as questionMessages } from '@/frontend/utils/forms/questions';
import { stringSchema } from '@/frontend/utils/forms/forms';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.submitQuestion.image', {
  answerDescription: 'Description of the image',
  answerSource: 'Source of the image',
});
import { getFileFromRef, imageFileSchema } from '@/frontend/utils/forms/files';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import { MyTextInput } from '@/frontend/components/forms/StyledFormComponents';
import { UploadImage } from '@/frontend/components/forms/UploadFile';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

import { useRouter } from 'next/navigation';

import React, { useRef } from 'react';

import { Form, Formik } from 'formik';
import * as Yup from 'yup';

const QUESTION_TYPE = QuestionType.IMAGE;

export default function SubmitImageQuestionForm({ userId, ...props }) {
  const intl = useIntl();
  const router = useRouter();

  const [submitImageQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
    try {
      // await handleImageFormSubmission(values, session.user.id, fileRef)
      const image = getFileFromRef(fileRef);
      if (!image) {
        throw new Error('No image file');
      }
      const { files, topic, lang, ...others } = values;
      const { title, answer_description, answer_source } = details;

      const questionId = await submitQuestion(
        {
          details: {
            title,
            answer: {
              description: answer_description,
              source: answer_source,
            },
          },
          type: QUESTION_TYPE,
          topic,
          // subtopics,
          lang,
        },
        userId,
        {
          image: image,
        }
      );
      if (props.inGameEditor) {
        await addQuestionToRound(props.gameId, props.roundId, questionId, userId);
      }
    } catch (error) {
      console.error('Failed to submit your question:', error);
    }
  });

  const fileRef = useRef(null);

  const validationSchema = Yup.object({
    lang: localeSchema(),
    topic: topicSchema(),
    title: stringSchema(ImageQuestion.TITLE_MAX_LENGTH),
    answer_description: stringSchema(ImageQuestion.ANSWER_DESCRIPTION_MAX_LENGTH, false),
    answer_source: stringSchema(ImageQuestion.ANSWER_SOURCE_MAX_LENGTH),
    files: imageFileSchema(fileRef, true),
  });

  return (
    <Formik
      initialValues={{
        lang: DEFAULT_LOCALE,
        topic: '',
        title: '',
        answer_description: '',
        answer_source: '',
        files: '',
      }}
      onSubmit={async (values) => {
        await submitImageQuestion(values, fileRef);
        if (props.inSubmitPage) {
          router.push('/submit/');
        } else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
      validationSchema={validationSchema}
    >
      <Form>
        <SelectLanguage name="lang" validationSchema={validationSchema} />

        <SelectQuestionTopic name="topic" validationSchema={validationSchema} />

        <MyTextInput
          label={intl.formatMessage(questionMessages.questionTitle)}
          name="title"
          type="text"
          placeholder="Object + Video game"
          validationSchema={validationSchema}
          maxLength={ImageQuestion.TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(messages.answerDescription)}
          name="answer_description"
          type="text"
          placeholder="Flask of Wondrous Physick"
          validationSchema={validationSchema}
          maxLength={ImageQuestion.ANSWER_DESCRIPTION_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(messages.answerSource)}
          name="answer_source"
          type="text"
          placeholder="Elden Ring"
          validationSchema={validationSchema}
          maxLength={ImageQuestion.ANSWER_SOURCE_MAX_LENGTH}
        />

        <UploadImage fileRef={fileRef} name="files" validationSchema={validationSchema} />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
      </Form>
    </Formik>
  );
}
