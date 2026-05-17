import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Form, Formik } from 'formik';
import { useIntl } from 'react-intl';
/* Validation  */
import * as Yup from 'yup';

import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MySelect, MyTextInput } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { UploadAudio, UploadImage } from '@/frontend/components/common/UploadFile';
import { audioFileSchema, getFileFromRef, imageFileSchema } from '@/frontend/helpers/forms/files';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema, type Locale } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import { BlindtestQuestion, BlindtestType } from '@/models/questions/blindtest';
import { QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.forms.submitQuestion.blindtest', {
  type: 'Type of the blindtest',
  selectType: 'Select the type',
  answerTitle: 'Title of the audio',
  answerSource: 'Source of the audio',
  answerAuthor: 'Author of the audio',
});

const BLINDTEST_TITLE_EXAMPLE = 'Film';
const BLINDTEST_ANSWER_TITLE_EXAMPLE = 'Can You Hear The Music';
const BLINDTEST_ANSWER_SOURCE_EXAMPLE = 'Oppenheimer';
const BLINDTEST_ANSWER_AUTHOR_EXAMPLE = 'Ludwig Göransson';

const QUESTION_TYPE = QuestionType.BLINDTEST;

const subtypeSchema = () =>
  Yup.string().oneOf(BlindtestType.getAllTypes(), 'Invalid question subtype.').required('Required.');

interface QuestionFormProps {
  userId?: string;
  questionToEdit?: Record<string, unknown>;
  inGameEditor?: boolean;
  inSubmitPage?: boolean;
  gameId?: string;
  roundId?: string;
  onDialogClose?: () => void;
}

export default function SubmitBlindtestQuestionForm({ userId, ...props }: QuestionFormProps) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitBlindtestQuestion, isSubmitting] = useAsyncAction(
    async (
      values: Record<string, string>,
      imageFileRef: React.RefObject<HTMLInputElement | null>,
      audioFileRef: React.RefObject<HTMLInputElement | null>
    ) => {
      try {
        const audio = getFileFromRef(audioFileRef);
        if (!audio && !q) {
          throw new Error('No audio file');
        }
        const image = getFileFromRef(imageFileRef);

        const { audioFiles: _af, imageFiles: _if, topic, lang, ...others } = values;
        const { title, answer_title, answer_source, answer_author, subtype } = others;
        const data = {
          details: {
            title,
            answer: {
              title: answer_title,
              source: answer_source,
              author: answer_author,
            },
            subtype,
          },
          type: QUESTION_TYPE,
          topic,
          lang,
        };
        const files = { audio: audio || undefined, image: image || undefined };

        if (q) {
          await editQuestion(data, q.id as string, files);
        } else {
          const questionId = await submitQuestion(data, userId, files);
          if (props.inGameEditor) {
            await addQuestionToRound(props.gameId, props.roundId, questionId, userId);
          }
        }
      } catch (error) {
        console.error('Failed to submit your question:', error);
      }
    }
  );

  const imageFileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  const validationSchema = Yup.object({
    lang: localeSchema(),
    topic: topicSchema(),
    subtype: subtypeSchema(),
    title: stringSchema(BlindtestQuestion.TITLE_MAX_LENGTH),
    answer_title: stringSchema(BlindtestQuestion.ANSWER_TITLE_MAX_LENGTH),
    answer_source: stringSchema(BlindtestQuestion.ANSWER_SOURCE_MAX_LENGTH),
    answer_author: stringSchema(BlindtestQuestion.ANSWER_AUTHOR_MAX_LENGTH, false),
    imageFiles: imageFileSchema(imageFileRef, false),
    audioFiles: audioFileSchema(audioFileRef, !q),
  });

  return (
    <Formik
      initialValues={
        q
          ? {
              lang: (q.lang as string) || DEFAULT_LOCALE,
              topic: (q.topic as string) || '',
              subtype: (q.subtype as string) || '',
              title: (q.title as string) || '',
              answer_title: (q.answer as Record<string, string>)?.title || '',
              answer_source: (q.answer as Record<string, string>)?.source || '',
              answer_author: (q.answer as Record<string, string>)?.author || '',
              audioFiles: '',
              imageFiles: '',
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              subtype: '',
              title: '',
              answer_title: '',
              answer_source: '',
              answer_author: '',
              audioFiles: '',
              imageFiles: '',
            }
      }
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={async (values) => {
        await submitBlindtestQuestion(values, imageFileRef, audioFileRef);
        if (props.inSubmitPage) router.push('/submit');
        else if (props.inGameEditor) {
          props.onDialogClose?.();
        }
      }}
    >
      <Form>
        <SelectLanguage name="lang" validationSchema={validationSchema} />

        <SelectQuestionTopic name="topic" validationSchema={validationSchema} />

        <MySelect label={intl.formatMessage(messages.type)} name="subtype" validationSchema={validationSchema}>
          <option value="">{intl.formatMessage(messages.selectType)}</option>
          {BlindtestType.getAllTypes().map((type) => (
            <option key={type} value={type}>
              {BlindtestType.getEmoji(type)} {BlindtestType.getTitle(type, intl.locale as Locale)}
            </option>
          ))}
        </MySelect>

        <MyTextInput
          label={intl.formatMessage(questionMessages.questionTitle)}
          name="title"
          type="text"
          placeholder={BLINDTEST_TITLE_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={BlindtestQuestion.TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(messages.answerTitle)}
          name="answer_title"
          type="text"
          placeholder={BLINDTEST_ANSWER_TITLE_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={BlindtestQuestion.ANSWER_TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(messages.answerAuthor)}
          name="answer_author"
          type="text"
          placeholder={BLINDTEST_ANSWER_AUTHOR_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={BlindtestQuestion.ANSWER_AUTHOR_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(messages.answerSource)}
          name="answer_source"
          type="text"
          placeholder={BLINDTEST_ANSWER_SOURCE_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={BlindtestQuestion.ANSWER_SOURCE_MAX_LENGTH}
        />

        <UploadAudio
          fileRef={audioFileRef}
          name="audioFiles"
          validationSchema={validationSchema}
          existingUrl={q?.audio as string | undefined}
        />

        <UploadImage
          fileRef={imageFileRef}
          name="imageFiles"
          validationSchema={validationSchema}
          existingUrl={(q?.answer as Record<string, string> | undefined)?.image}
        />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
      </Form>
    </Formik>
  );
}
