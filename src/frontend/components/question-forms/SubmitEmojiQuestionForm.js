import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { Form, Formik, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

import { EmojiQuestion } from '@/backend/models/questions/Emoji';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MyTextInput } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { UploadImage } from '@/frontend/components/common/UploadFile';
import { emojiCount, onlyEmojis } from '@/frontend/helpers/emojis';
import { getFileFromRef, imageFileSchema } from '@/frontend/helpers/forms/files';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';

const QUESTION_TYPE = QuestionType.EMOJI;

const EMOJI_TITLE_EXAMPLE = 'Film';
const EMOJI_CLUE_EXAMPLE = '🚢🎻🧊';
const EMOJI_ANSWER_TITLE_EXAMPLE = 'Titanic';

/* Indicator on the number of emojis being written in a string field composed only of emojis */
export const numEmojisIndicator = (strField, maxLength) => '(' + emojiCount(strField) + '/' + maxLength + ')';

export const emojiClueSchema = () =>
  Yup.string()
    .test('only-emojis', 'Only emojis are allowed!', (str) => onlyEmojis(str))
    .test(
      'emoji-count',
      `There must be at least ${EmojiQuestion.CLUE_MIN_LENGTH} and at most ${EmojiQuestion.CLUE_MAX_LENGTH} emojis`,
      (str) => {
        const numEmojis = emojiCount(str);
        return EmojiQuestion.CLUE_MIN_LENGTH <= numEmojis && numEmojis <= EmojiQuestion.CLUE_MAX_LENGTH;
      }
    )
    .required('Required.');

export default function SubmitEmojiQuestionForm({ userId, ...props }) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit;

  const fileRef = useRef(null);

  const [submitEmojiQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
    try {
      const image = getFileFromRef(fileRef);

      const { topic, lang, title, clue, answer_title } = values;
      const data = {
        details: { title, clue, answer: { title: answer_title } },
        type: QUESTION_TYPE,
        topic,
        lang,
      };
      const files = { image: image || undefined };

      if (q) {
        await editQuestion(data, q.id, files);
      } else {
        const questionId = await submitQuestion(data, userId, files);
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
    title: stringSchema(EmojiQuestion.TITLE_MAX_LENGTH),
    answer_title: stringSchema(EmojiQuestion.ANSWER_TITLE_MAX_LENGTH),
    clue: emojiClueSchema(),
    files: imageFileSchema(fileRef, false),
  });

  return (
    <Formik
      initialValues={
        q
          ? {
              lang: q.lang || DEFAULT_LOCALE,
              topic: q.topic || '',
              title: q.title || '',
              answer_title: q.answer?.title || '',
              clue: q.clue || '',
              files: '',
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              title: '',
              answer_title: '',
              clue: '',
              files: '',
            }
      }
      onSubmit={async (values) => {
        await submitEmojiQuestion(values, fileRef);
        if (props.inSubmitPage) router.push('/submit');
        else if (props.inGameEditor) {
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
          placeholder={EMOJI_TITLE_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={EmojiQuestion.TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(questionMessages.answer)}
          name="answer_title"
          type="text"
          placeholder={EMOJI_ANSWER_TITLE_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={EmojiQuestion.ANSWER_TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label="Emojis"
          name="clue"
          type="text"
          placeholder={EMOJI_CLUE_EXAMPLE}
          validationSchema={validationSchema}
          maxLength={EmojiQuestion.CLUE_MAX_LENGTH}
          onlyEmojis={true}
        />

        {/* Clue */}
        <EmojiPicker />

        {/* Image */}
        <UploadImage
          fileRef={fileRef}
          name="files"
          validationSchema={validationSchema}
          existingUrl={q?.answer?.image}
        />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
      </Form>
    </Formik>
  );
}

const DynamicEmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const EMOJI_LOCALE_DATA = {
  fr: () => import('emoji-picker-react/dist/data/emojis-fr.json'),
};

function EmojiPicker() {
  const intl = useIntl();
  const formik = useFormikContext();
  const [emojiData, setEmojiData] = React.useState(null);

  React.useEffect(() => {
    const loader = EMOJI_LOCALE_DATA[intl.locale];
    if (loader) {
      loader().then((mod) => setEmojiData(mod.default));
    } else {
      setEmojiData(null);
    }
  }, [intl.locale]);

  return (
    <DynamicEmojiPicker
      emojiStyle="native"
      emojiData={emojiData}
      width="15%"
      height={400}
      onEmojiClick={(emojiData) => {
        formik.setFieldValue('clue', formik.values.clue + emojiData.emoji);
      }}
    />
  );
}
