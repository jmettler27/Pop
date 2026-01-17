import { QuestionType } from '@/backend/models/questions/QuestionType';
import { OddOneOutQuestion } from '@/backend/models/questions/OddOneOut';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import {
  ADD_ITEM,
  QUESTION_HINTS_REMARKS,
  QUESTION_ITEM,
  QUESTION_TITLE_LABEL,
  SELECT_PROPOSAL,
} from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { stringSchema } from '@/frontend/utils/forms/forms';

import { MyTextInput, MySelect, StyledErrorMessage } from '@/frontend/components/forms/StyledFormComponents';
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

const QUESTION_TYPE = QuestionType.ODD_ONE_OUT;

const OOO_TITLE_EXAMPLE = {
  en: 'Which films feature one or more serial killers?',
  'fr-FR': 'Quels films mettent en scène un ou plusieurs tueurs en série?',
};

const OOO_NOTE_EXAMPLE = {
  en: 'Hint: The odd one out is a zombie film.',
  'fr-FR': "Indice: L'intrus est un film de zombies.",
};

const OOO_ITEMS_EXAMPLE = {
  en: [
    {
      title: 'Man Bites Dog (🇧🇪, 1992)',
      explanation: 'Mockumentary about a serial killer played by Benoît Poelvoorde.',
    },
    {
      title: 'The Silence of The Lambs (🇺🇸, 1990)',
      explanation: 'Featuring the cannibalistic psychiatrist Hannibal Lecter, played by Anthony Hopkins.',
    },
    { title: 'Fear City: A Family-Style Comedy (🇫🇷, 1994)', explanation: 'A killer armed with a hammer and sickle.' },
    { title: 'Braindead (🇳🇿, 1992)', explanation: 'Horrific comedy with zombies, directed by Peter Jackson.' },
    { title: 'Seven (🇺🇸, 1995)', explanation: "What's in the box?" },
    { title: 'Hot Fuzz (🇬🇧, 2007)', explanation: 'The Neighbourhood Watch Alliance of Sandford.' },
    { title: 'Saw (🇺🇸, 2004)', explanation: "John Kramer a.k.a. 'Jigsaw'." },
    { title: 'The House That Jack Built (🇩🇰, 2018)', explanation: 'Architect by day, murderer by night.' },
    {
      title: 'High Tension (🇫🇷, 2003)',
      explanation: 'French slasher in which a serial killer massacres a family on a farm.',
    },
    { title: 'American Psycho (🇺🇸, 2000)', explanation: 'Patrick Bateman.' },
  ],
  'fr-FR': [
    {
      explanation: 'Faux documentaire belge sur un tueur en série, incarné par Benoît Poelvoorde',
      title: 'C’est arrivé près de chez vous (1992)',
    },
    {
      explanation: 'Met en scène le psychiatre cannibale Hannibal Lecter, incarné par Anthony Hopkins',
      title: 'Le silence des agneaux (1990)',
    },
    { explanation: "Un tueur armé d'un marteau et d'une faucille", title: 'La cité de la peur (1994)' },
    { explanation: 'Comédie horrifique avec des zombies, réalisée par Peter Jackson', title: 'Braindead (1992)' },
    { explanation: 'Qu’y a-t-il dans la boîte?', title: 'Seven (1995)' },
    { title: 'Hot Fuzz (2007)', explanation: 'Simon Skinner' },
    { title: 'Saw (2004)', explanation: 'John Kramer, alias “Jigsaw”' },
    { title: 'The House That Jack Built (2018)', explanation: 'Architecte le jour, tueur en série la nuit' },
    {
      explanation: 'Slasher français dans lequel un tueur en série massacre une famille dans une ferme',
      title: 'Haute Tension (2003)',
    },
    { title: 'American Psycho (2000)', explanation: 'Patrick Bateman' },
  ],
};

const oddOneOutItemsSchema = () =>
  Yup.array()
    .of(
      Yup.object({
        title: stringSchema(OddOneOutQuestion.ITEM_TITLE_MAX_LENGTH),
        explanation: stringSchema(OddOneOutQuestion.ITEM_EXPLANATION_MAX_LENGTH),
      })
    )
    .min(OddOneOutQuestion.MIN_NUM_ITEMS, `There must be at least ${OddOneOutQuestion.MIN_NUM_ITEMS} items`)
    .max(OddOneOutQuestion.MAX_NUM_ITEMS, `There must be at most ${OddOneOutQuestion.MAX_NUM_ITEMS} items`)
    .required('Required.');

export default function SubmitOddOneOutQuestionForm({ userId, lang, ...props }) {
  const router = useRouter();

  const [submitOOOQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, ...details } = values;
      const questionId = await submitQuestion(
        {
          details: { ...details },
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
      console.error('There was an error submitting your question:', error);
    }
  });

  return (
    <Wizard
      initialValues={{
        lang: DEFAULT_LOCALE,
        topic: '',
        title: '',
        note: '',
        items: Array(OddOneOutQuestion.MIN_NUM_ITEMS).fill({ title: '', explanation: '' }),
        answerIdx: -1,
      }}
      onSubmit={async (values) => {
        await submitOOOQuestion(values);
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
          title: stringSchema(OddOneOutQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(OddOneOutQuestion.NOTE_MAX_LENGTH, false),
        })}
        lang={lang}
      />

      {/* Step 2: Proposals */}
      <EnterItemsStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          items: oddOneOutItemsSchema(),
          answerIdx: Yup.number()
            .min(0, 'Required.')
            .max(OddOneOutQuestion.MAX_NUM_ITEMS - 1, 'Required.')
            .required('Required.'),
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
        placeholder={OOO_TITLE_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={OddOneOutQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={QUESTION_HINTS_REMARKS[lang]}
        name="note"
        type="text"
        placeholder={OOO_NOTE_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={OddOneOutQuestion.NOTE_MAX_LENGTH}
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

  const exampleItems = OOO_ITEMS_EXAMPLE[lang];

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <p>
        {NUM_ITEMS_ALLOWED[lang]}: {OddOneOutQuestion.MIN_NUM_ITEMS}-{OddOneOutQuestion.MAX_NUM_ITEMS}.
      </p>

      <p>{ENTER_ITEMS[lang]}</p>

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
                    maxLength={OddOneOutQuestion.ITEM_TITLE_MAX_LENGTH}
                    fieldType="object_in_array"
                  />
                  <TitleError index={idx} />

                  <MyTextInput
                    label={`${EXPLANATION[lang]} #${idx + 1}`}
                    name={`items.${idx}.explanation`}
                    type="text"
                    placeholder={exampleItems[idx % exampleItems.length].explanation}
                    validationSchema={validationSchema}
                    maxLength={OddOneOutQuestion.ITEM_EXPLANATION_MAX_LENGTH}
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

      {!errors.items && formik.touched.items && (
        <MySelect
          label={ANSWER_IDX_LABEL[lang]}
          name="answerIdx"
          validationSchema={validationSchema}
          onChange={(e) => formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))}
        >
          <option value="">{SELECT_PROPOSAL[lang]}</option>
          {values.items.map((item, index) => (
            <option key={index} value={index}>
              {item.title}
            </option>
          ))}
        </MySelect>
      )}
    </WizardStep>
  );
}

const NUM_ITEMS_ALLOWED = {
  en: 'Number of proposals allowed',
  'fr-FR': 'Nombre de propositions autorisées',
};

const ENTER_ITEMS = {
  en: 'All the proposals must be correct, except for one (the odd one out).',
  'fr-FR': "Toutes les propositions doivent être correctes, sauf une (l'intrus).",
};

const PROPOSAL = {
  en: 'Proposal',
  'fr-FR': 'Proposition',
};

const EXPLANATION = {
  en: 'Explanation',
  'fr-FR': 'Explication',
};

const ANSWER_IDX_LABEL = {
  en: 'What proposal is the odd one?',
  'fr-FR': "Qui est l'intrus ?",
};
