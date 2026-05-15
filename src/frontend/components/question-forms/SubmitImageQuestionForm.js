import React, { useRef } from 'react';
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
import { UploadImage } from '@/frontend/components/common/UploadFile';
import { getFileFromRef, imageFileSchema } from '@/frontend/helpers/forms/files';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import { ImageQuestion } from '@/models/questions/Image';
import { QuestionType } from '@/models/questions/QuestionType';

const messages = defineMessages('frontend.forms.submitQuestion.image', {
  answerDescription: 'Description of the image',
  answerSource: 'Source of the image',
});

const QUESTION_TYPE = QuestionType.IMAGE;

export default function SubmitImageQuestionForm({ userId, ...props }) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit;

  const [submitImageQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
    try {
      const image = getFileFromRef(fileRef);
      if (!image && !q) {
        throw new Error('No image file');
      }
      const { files, topic, lang, ...others } = values;
      const { title, answer_description, answer_source } = others;

      const data = {
        details: {
          title,
          answer: {
            description: answer_description,
            source: answer_source,
          },
        },
        type: QUESTION_TYPE,
        topic,
        lang,
      };
      const uploadFiles = { image: image || undefined };

      if (q) {
        await editQuestion(data, q.id, uploadFiles);
      } else {
        const questionId = await submitQuestion(data, userId, uploadFiles);
        if (props.inGameEditor) {
          await addQuestionToRound(props.gameId, props.roundId, questionId, userId);
        }
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
    files: imageFileSchema(fileRef, !q),
  });

  return (
    <Formik
      initialValues={
        q
          ? {
              lang: q.lang || DEFAULT_LOCALE,
              topic: q.topic || '',
              title: q.title || '',
              answer_description: q.answer?.description || '',
              answer_source: q.answer?.source || '',
              files: '',
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              title: '',
              answer_description: '',
              answer_source: '',
              files: '',
            }
      }
      onSubmit={async (values) => {
        await submitImageQuestion(values, fileRef);
        if (props.inSubmitPage) {
          router.push('/submit/');
        } else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
      validationSchema={validationSchema}
      enableReinitialize
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

        <UploadImage fileRef={fileRef} name="files" validationSchema={validationSchema} existingUrl={q?.image} />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
      </Form>
    </Formik>
  );
}
