import { QuestionType } from '@/backend/models/questions/QuestionType';
import { LabellingQuestion } from '@/backend/models/questions/Labelling';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import {
  ADD_ITEM,
  QUESTION_HINTS_REMARKS,
  QUESTION_ITEM,
  QUESTION_TITLE_LABEL,
  SUBMIT_QUESTION_BUTTON_LABEL,
} from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/frontend/utils/forms/forms';
import { getFileFromRef, imageFileSchema } from '@/frontend/utils/forms/files';

import { MyTextInput, StyledErrorMessage } from '@/frontend/components/forms/StyledFormComponents';
import { UploadImage } from '@/frontend/components/forms/UploadFile';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';

import { useRouter } from 'next/navigation';

import React, { useRef } from 'react';
import { Field, FieldArray, Form, Formik, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

const QUESTION_TYPE = QuestionType.LABELLING;

const LABEL_TITLE_EXAMPLE = {
  en: 'Label the members of the Simpson family',
  'fr-FR': 'Nommez les membres de la famille Simpson',
};

const LABEL_NOTE_EXAMPLE = '';

const LABEL_EXAMPLE = ['Homer Simpson', 'Marge Simpson', 'Bart Simpson', 'Lisa Simpson'];

const labelsSchema = () =>
  Yup.array()
    .of(stringSchema(LabellingQuestion.LABEL_MAX_LENGTH))
    .min(LabellingQuestion.MIN_NUM_LABELS, `There must be at least ${LabellingQuestion.MIN_NUM_LABELS} labels`)
    .max(LabellingQuestion.MAX_NUM_LABELS, `There can be at most ${LabellingQuestion.MAX_NUM_LABELS} labels`);

export default function SubmitLabellingQuestionForm({ userId, lang = DEFAULT_LOCALE, ...props }) {
  const router = useRouter();

  const [submitLabelQuestion, isSubmitting] = useAsyncAction(async (values, fileRef) => {
    try {
      // await handleImageFormSubmission(values, session.user.id, fileRef)
      const image = getFileFromRef(fileRef);
      if (!image) {
        throw new Error('No image file');
      }
      const { files, topic, lang, ...details } = values;
      const { title, labels } = details;

      const questionId = await submitQuestion(
        {
          details: {
            title,
            labels,
          },
          type: QUESTION_TYPE,
          topic,
          // subtopics,
          lang,
          createdBy: userId,
          approved: true,
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
    title: stringSchema(LabellingQuestion.TITLE_MAX_LENGTH),
    note: stringSchema(LabellingQuestion.NOTE_MAX_LENGTH, false),
    files: imageFileSchema(fileRef, true),
    labels: labelsSchema(),
  });

  return (
    <Formik
      initialValues={{
        lang: DEFAULT_LOCALE,
        topic: '',
        title: '',
        note: '',
        files: '',
        labels: Array(LabellingQuestion.MIN_NUM_LABELS).fill(''),
      }}
      onSubmit={async (values) => {
        await submitLabelQuestion(values, fileRef);
        if (props.inSubmitPage) {
          router.push('/submit/');
        } else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
      validationSchema={validationSchema}
    >
      <Form>
        <SelectLanguage lang={lang} name="lang" validationSchema={validationSchema} />

        <SelectQuestionTopic lang={lang} name="topic" validationSchema={validationSchema} />

        <MyTextInput
          label={QUESTION_TITLE_LABEL[lang]}
          name="title"
          type="text"
          placeholder={LABEL_TITLE_EXAMPLE[lang]}
          validationSchema={validationSchema}
          maxLength={LabellingQuestion.TITLE_MAX_LENGTH}
        />

        <MyTextInput
          label={QUESTION_HINTS_REMARKS[lang]}
          name="note"
          type="text"
          placeholder=""
          validationSchema={validationSchema}
          maxLength={LabellingQuestion.NOTE_MAX_LENGTH}
        />

        <UploadImage fileRef={fileRef} name="files" validationSchema={validationSchema} lang={lang} />

        <EnterLabels lang={lang} validationSchema={validationSchema} />

        <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_QUESTION_BUTTON_LABEL[lang]} />
      </Form>
    </Formik>
  );
}

function EnterLabels({ validationSchema, lang }) {
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
        {NUM_LABELS_ALLOWED[lang]}: {LabellingQuestion.MIN_NUM_LABELS}-{LabellingQuestion.MAX_NUM_LABELS}.
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
                    {requiredStringInArrayFieldIndicator(validationSchema, 'labels')}
                    {QUESTION_ITEM[lang]} #{index + 1} {numCharsIndicator(item, LabellingQuestion.LABEL_MAX_LENGTH)}
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
              {ADD_ITEM[lang]}
            </Button>
          </div>
        )}
      </FieldArray>

      <ItemArrayErrors />
    </>
  );
}

const NUM_LABELS_ALLOWED = {
  en: 'Number of labels allowed',
  'fr-FR': "Nombre d'étiquettes autorisé",
};
