import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Field, FieldArray, Form, Formik, useField, useFormikContext } from 'formik';
import { Plus, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { ObjectSchema } from 'yup';

import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MyTextInput, StyledErrorMessage } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { UploadImage } from '@/frontend/components/common/UploadFile';
import { Button } from '@/frontend/components/ui/button';
import { imageFileSchema } from '@/frontend/helpers/forms/files';
import { numCharsIndicator, requiredStringInArrayFieldIndicator, stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { submitQuestionForm, type QuestionFormPayload } from '@/frontend/helpers/forms/submitQuestionForm';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, Locale, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import { LabellingQuestion } from '@/models/questions/labelling';
import { QuestionType } from '@/models/questions/question-type';
import { Topic } from '@/models/topic';

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

interface QuestionFormProps {
  questionToEdit?: Record<string, unknown>;
  inGameEditor?: boolean;
  inSubmitPage?: boolean;
  gameId?: string;
  roundId?: string;
  onDialogClose?: () => void;
}

export default function SubmitLabellingQuestionForm(props: QuestionFormProps) {
  const intl = useIntl();
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);

  const [submitLabelQuestion, isSubmitting] = useAsyncAction(
    async (values: Record<string, string>, image: File | null) => {
      try {
        if (!image && !q) {
          throw new Error('No image file');
        }
        const { files: _files, topic, lang, ...others } = values as typeof values & { topic: Topic; lang: Locale };
        const { title, note } = others;
        const labels = (others as unknown as { labels: string[] }).labels;

        const data: QuestionFormPayload = {
          type: QUESTION_TYPE,
          topic,
          lang,
          details: { title, labels, note },
        };
        await submitQuestionForm(data, {
          editId: q?.id as string | undefined,
          files: { image: image || undefined },
          round: props.inGameEditor ? { gameId: props.gameId as string, roundId: props.roundId as string } : undefined,
        });
      } catch (error) {
        console.error('Failed to submit your question:', error);
      }
    }
  );

  const validationSchema = Yup.object({
    lang: localeSchema(),
    topic: topicSchema(),
    title: stringSchema(LabellingQuestion.TITLE_MAX_LENGTH),
    note: stringSchema(LabellingQuestion.NOTE_MAX_LENGTH, false),
    files: imageFileSchema(image, !q),
    labels: labelsSchema(),
  });

  return (
    <Formik
      initialValues={
        q
          ? {
              lang: (q.lang as string) || DEFAULT_LOCALE,
              topic: (q.topic as string) || '',
              title: (q.title as string) || '',
              note: (q.note as string) || '',
              files: '',
              labels: (q.labels as string[]) || Array(LabellingQuestion.MIN_NUM_LABELS).fill(''),
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
        await submitLabelQuestion(values as unknown as Record<string, string>, image);
        if (props.inSubmitPage) {
          router.push('/submit/');
        } else if (props.inGameEditor) {
          props.onDialogClose?.();
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

        <UploadImage
          fileRef={fileRef}
          name="files"
          validationSchema={validationSchema}
          existingUrl={q?.image as string | undefined}
          image={image}
          onFileChange={setImage}
        />

        <EnterLabels validationSchema={validationSchema} />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(questionMessages.submit)} />
      </Form>
    </Formik>
  );
}

interface EnterLabelsProps {
  validationSchema: ObjectSchema<Record<string, unknown>>;
}

function EnterLabels({ validationSchema }: EnterLabelsProps) {
  const intl = useIntl();
  const formik = useFormikContext<{ labels: string[] }>();

  const values = formik.values;
  const errors = formik.errors;

  const ItemError = ({ index }: { index: number }) => {
    const [, meta] = useField('labels.' + index);
    return (
      typeof errors.labels === 'object' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  return (
    <>
      <p className="mb-4">
        {intl.formatMessage(messages.numLabelsAllowed)}: {LabellingQuestion.MIN_NUM_LABELS}-
        {LabellingQuestion.MAX_NUM_LABELS}.
      </p>

      <FieldArray name="labels">
        {({ remove, push }) => (
          <div>
            {values.labels.length > 0 &&
              values.labels.map((item, index) => (
                <section key={index} className="my-4 pb-4 px-4 border-2 border-dashed border-gray-500 w-[500px]">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>

                  <ItemError index={index} />
                </section>
              ))}
            <Button variant="outline" onClick={() => push('')}>
              <Plus className="mr-2 size-4" />
              {intl.formatMessage(questionMessages.addItem)}
            </Button>
          </div>
        )}
      </FieldArray>

      {typeof errors.labels === 'string' && <StyledErrorMessage>{errors.labels}</StyledErrorMessage>}
    </>
  );
}
