import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ReorderingQuestion } from '@/backend/models/questions/Reordering';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import {
  ADD_ITEM,
  QUESTION_HINTS_REMARKS,
  QUESTION_ITEM,
  QUESTION_TITLE_LABEL,
} from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { stringSchema } from '@/frontend/utils/forms/forms';

import { MyTextInput, StyledErrorMessage } from '@/frontend/components/forms/StyledFormComponents';
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

import { useRouter } from 'next/navigation';

import React from 'react';
import { FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

const QUESTION_TYPE = QuestionType.REORDERING;

const REORDERING_TITLE_EXAMPLE = {
  en: 'Which films feature one or more serial killers?',
  'fr-FR': 'Quels films mettent en scène un ou plusieurs tueurs en série?',
};
const REORDERING_NOTE_EXAMPLE = {
  en: 'Hint: The odd one out is a zombie film.',
  'fr-FR': "Indice: L'intrus est un film de zombies.",
};

const REORDERING_ITEMS_EXAMPLE = {
  en: [
    { title: "Philosopher's Stone", explanation: '' },
    { title: 'Chamber of Secrets', explanation: '' },
    { title: 'Prisoner of Azkaban', explanation: '' },
    { title: 'Goblet of Fire', explanation: '' },
    { title: 'Order of the Phoenix', explanation: '' },
    { title: 'Half-Blood Prince', explanation: '' },
    { title: 'Deathly Hallows', explanation: '' },
  ],
  'fr-FR': [
    { title: "L'école des sorciers", explanation: '' },
    { title: 'La chambre des sorciers', explanation: '' },
    { title: "Le prisonnier d'Azkaban", explanation: '' },
    { title: 'La coupe de feu', explanation: '' },
    { title: "L'ordre du phénix", explanation: '' },
    { title: "Le prisonnier d'Azkaban", explanation: '' },
    { title: 'Les reliques de la nort', explanation: '' },
  ],
};

const reorderingItemsSchema = () =>
  Yup.array()
    .of(
      Yup.object({
        title: stringSchema(ReorderingQuestion.ITEM_TITLE_MAX_LENGTH),
        explanation: stringSchema(ReorderingQuestion.ITEM_EXPLANATION_MAX_LENGTH, false),
      })
    )
    .min(ReorderingQuestion.MIN_NUM_ITEMS, `There must be at least ${ReorderingQuestion.MIN_NUM_ITEMS} items`)
    .max(ReorderingQuestion.MAX_NUM_ITEMS, `There must be at most ${ReorderingQuestion.MAX_NUM_ITEMS} items`);
// .required("Required.")

export default function SubmitReorderingQuestionForm({ userId, lang, ...props }) {
  const router = useRouter();

  const [submitReorderingQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, ...others } = values;
      const questionId = await submitQuestion(
        {
          details: { ...others },
          type: QUESTION_TYPE,
          topic,
          // subtopics,,
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

  return (
    <Wizard
      initialValues={{
        lang: DEFAULT_LOCALE,
        topic: '',
        title: '',
        note: '',
        items: Array(ReorderingQuestion.MIN_NUM_ITEMS).fill({ title: '', explanation: '' }),
      }}
      onSubmit={async (values) => {
        await submitReorderingQuestion(values);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
      isSubmitting={isSubmitting}
    >
      {/* Step 1: General info */}
      <GeneralInfoStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          lang: localeSchema(),
          topic: topicSchema(),
          title: stringSchema(ReorderingQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(ReorderingQuestion.NOTE_MAX_LENGTH, false),
        })}
        lang={lang}
      />

      {/* Step 2: Proposals */}
      <EnterItemsStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          items: reorderingItemsSchema(),
        })}
        lang={lang}
      />
    </Wizard>
  );
}

function GeneralInfoStep({ onSubmit, validationSchema, lang }) {
  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <SelectLanguage lang={lang} name="lang" validationSchema={validationSchema} />

      <SelectQuestionTopic lang={lang} name="topic" validationSchema={validationSchema} />

      <MyTextInput
        label={QUESTION_TITLE_LABEL[lang]}
        name="title"
        type="text"
        placeholder={REORDERING_TITLE_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={ReorderingQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={QUESTION_HINTS_REMARKS[lang]}
        name="note"
        type="text"
        placeholder={REORDERING_NOTE_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={ReorderingQuestion.NOTE_MAX_LENGTH}
      />
    </WizardStep>
  );
}

function EnterItemsStep({ onSubmit, validationSchema, lang }) {
  const formik = useFormikContext();

  const values = formik.values;
  const errors = formik.errors;

  const ItemArrayErrors = () =>
    typeof errors.items === 'string' && <StyledErrorMessage>{errors.items}</StyledErrorMessage>;

  const TitleError = ({ index }) =>
    typeof errors.items === 'array' &&
    errors.items[index] && <StyledErrorMessage>{errors.items[index].title}</StyledErrorMessage>;

  const ExplanationError = ({ index }) =>
    typeof errors.items === 'array' &&
    errors.items[index] && <StyledErrorMessage>{errors.items[index].explanation}</StyledErrorMessage>;

  const exampleItems = REORDERING_ITEMS_EXAMPLE[lang];

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <p>
        {NUM_ITEMS_ALLOWED[lang]}: {ReorderingQuestion.MIN_NUM_ITEMS}-{ReorderingQuestion.MAX_NUM_ITEMS}.
      </p>

      <FieldArray name="items">
        {({ remove, push }) => (
          <>
            {values.items.length > 0 &&
              values.items.map((item, idx) => (
                <Box key={idx} component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
                  <span className="text-lg">
                    {QUESTION_ITEM[lang]} #{idx + 1}
                  </span>

                  <IconButton color="error" onClick={() => remove(idx)}>
                    <DeleteIcon />
                  </IconButton>

                  <MyTextInput
                    label={`${PROPOSAL[lang]} #${idx + 1}`}
                    name={`items.${idx}.title`}
                    type="text"
                    placeholder={exampleItems[idx % exampleItems.length].title}
                    validationSchema={validationSchema}
                    maxLength={ReorderingQuestion.ITEM_TITLE_MAX_LENGTH}
                    fieldType="object_in_array"
                  />
                  <TitleError index={idx} />

                  <MyTextInput
                    label={`${EXPLANATION[lang]} #${idx + 1}`}
                    name={`items.${idx}.explanation`}
                    type="text"
                    placeholder={exampleItems[idx % exampleItems.length].explanation}
                    validationSchema={validationSchema}
                    maxLength={ReorderingQuestion.ITEM_EXPLANATION_MAX_LENGTH}
                    fieldType="object_in_array"
                  />
                  <ExplanationError index={idx} />
                </Box>
              ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => push({ title: '', explanation: '' })}>
              {ADD_ITEM[lang]}
            </Button>
          </>
        )}
      </FieldArray>

      <ItemArrayErrors />
    </WizardStep>
  );
}

const NUM_ITEMS_ALLOWED = {
  en: 'Number of proposals allowed',
  'fr-FR': 'Nombre de propositions autorisées',
};

const PROPOSAL = {
  en: 'Proposal',
  'fr-FR': 'Proposition',
};

const EXPLANATION = {
  en: 'Explanation',
  'fr-FR': 'Explication',
};
