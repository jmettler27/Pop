import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, IconButton } from '@mui/material';
import Box from '@mui/system/Box';
import { Field, FieldArray, Form, Formik, useField, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

import { LabellingQuestion } from '@/backend/models/questions/Labelling';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MyTextInput, StyledErrorMessage } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { UploadImage } from '@/frontend/components/common/UploadFile';
import { getFileFromRef, imageFileSchema } from '@/frontend/helpers/forms/files';
import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.submitQuestion.labelling', {
  numLabelsAllowed: 'Number of labels allowed',
});

const QUESTION_TYPE = QuestionType.LABELLING;

const LABEL_EXAMPLE = ['Homer Simpson', 'Marge Simpson', 'Bart Simpson', 'Lisa Simpson'];

const labelsSchema = () =>
  Yup.array()
    .of(stringSchema(LabellingQuestion.LABEL_MAX_LENGTH))
    .min(LabellingQuestion.MIN_NUM_LABELS, `There must be at least ${LabellingQuestion.MIN_NUM_LABELS} labels`)
    .max(LabellingQuestion.MAX_NUM_LABELS, `There can be at most ${LabellingQuestion.MAX_NUM_LABELS} labels`);

export default function SubmitLabellingQuestionForm({ userId, ...props }) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit;

  const [submitLabelQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
    try {
      const image = getFileFromRef(fileRef);
      if (!image && !q) {
        throw new Error('No image file');
      }
      const { files, topic, lang, ...others } = values;
      const { title, labels, note } = others;

      const data = {
        details: { title, labels, note },
        type: QUESTION_TYPE,
        topic,
        lang,
      };
      const uploadFiles = { image: image || undefined };

      if (q) {
        await editQuestion(data, q.id, uploadFiles);
      } else {
        const questionId = await submitQuestion({ ...data, createdBy: userId, approved: true }, userId, uploadFiles);
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
    title: stringSchema(LabellingQuestion.TITLE_MAX_LENGTH),
    note: stringSchema(LabellingQuestion.NOTE_MAX_LENGTH, false),
    files: imageFileSchema(fileRef, !q),
    labels: labelsSchema(),
  });

  return (
    <Formik
      initialValues={
        q
          ? {
              lang: q.lang || DEFAULT_LOCALE,
              topic: q.topic || '',
              title: q.title || '',
              note: q.note || '',
              files: '',
              labels: q.labels || Array(LabellingQuestion.MIN_NUM_LABELS).fill(''),
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              title: '',
              note: '',
              files: '',
              labels: Array(LabellingQuestion.MIN_NUM_LABELS).fill(''),
            }
      }
      onSubmit={async (values) => {
        await submitLabelQuestion(values, fileRef);
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
          placeholder="Label the members of the Simpson family"
          validationSchema={validationSchema}
          maxLength={LabellingQuestion.TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label={intl.formatMessage(questionMessages.hintsRemarks)}
          name="note"
          type="text"
          placeholder=""
          validationSchema={validationSchema}
          maxLength={LabellingQuestion.NOTE_MAX_LENGTH}
        />

        <UploadImage fileRef={fileRef} name="files" validationSchema={validationSchema} existingUrl={q?.image} />

        <EnterLabels validationSchema={validationSchema} />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
      </Form>
    </Formik>
  );
}

function EnterLabels({ validationSchema }) {
  const intl = useIntl();
  const formik = useFormikContext();

  const values = formik.values;
  const errors = formik.errors;

  const ItemArrayErrors = () =>
    typeof errors.labels === 'string' && <StyledErrorMessage>{errors.labels}</StyledErrorMessage>;

  const ItemError = ({ index }) => {
    const [_, meta] = useField('labels.' + index);
    return (
      typeof errors.labels === 'object' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  return (
    <>
      <p>
        {intl.formatMessage(messages.numLabelsAllowed)}: {LabellingQuestion.MIN_NUM_LABELS}-
        {LabellingQuestion.MAX_NUM_LABELS}.
      </p>

      <FieldArray name="labels">
        {({ remove, push }) => (
          <div>
            {values.labels.length > 0 &&
              values.labels.map((item, index) => (
                <Box
                  key={index}
                  component="section"
                  sx={{ my: 2, pb: 2, px: 2, border: '2px dashed grey', width: '500px' }}
                >
                  <label htmlFor={'labels.' + index}>
                    {requiredStringInArrayFieldIndicator(validationSchema, 'labels', intl)}
                    {intl.formatMessage(questionMessages.item)} #{index + 1}{' '}
                    {numCharsIndicator(item, LabellingQuestion.LABEL_MAX_LENGTH)}
                  </label>
                  <Field
                    name={'labels.' + index}
                    type="text"
                    placeholder={LABEL_EXAMPLE[index % LABEL_EXAMPLE.length]}
                  />
                  <IconButton color="error" onClick={() => remove(index)}>
                    <DeleteIcon />
                  </IconButton>

                  <ItemError index={index} />
                </Box>
              ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => push('')}>
              {intl.formatMessage(questionMessages.addItem)}
            </Button>
          </div>
        )}
      </FieldArray>

      <ItemArrayErrors />
    </>
  );
}
