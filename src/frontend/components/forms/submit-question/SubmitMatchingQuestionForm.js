import { QuestionType } from '@/backend/models/questions/QuestionType';
import { MatchingQuestion } from '@/backend/models/questions/Matching';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import { QUESTION_HINTS_REMARKS, QUESTION_ITEM, QUESTION_TITLE_LABEL } from '@/frontend/utils/forms/questions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { stringSchema } from '@/frontend/utils/forms/forms';

import {
  MyTextInput,
  MySelect,
  StyledErrorMessage,
  MyNumberInput,
} from '@/frontend/components/forms/StyledFormComponents';
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/forms/SelectQuestionTopic';

import { useRouter } from 'next/navigation';

import React, { Fragment } from 'react';
import { FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/system/Box';

const QUESTION_TYPE = QuestionType.MATCHING;

const MATCHING_TITLE_EXAMPLE = 'Link these houses of Westeros to their seat';

const MATCHING_NOTE_EXAMPLE = '';

const MATCHING_ANSWER_EXAMPLE_2 = [
  { 0: 'Targaryen', 1: 'Dragonstone' },
  { 0: 'Stark', 1: 'Winterfell' },
  { 0: 'Lannister', 1: 'Casterly Rock' },
  { 0: 'Arryn', 1: 'Eyrie' },
  { 0: 'Tully', 1: 'Riverrun' },
  { 0: 'Greyjoy', 1: 'Pyke' },
  { 0: 'Baratheon', 1: "Storm's End" },
  { 0: 'Tyrrell', 1: 'Highgarden' },
  { 0: 'Martell', 1: 'Sunspear' },
];

const MATCHING_ANSWER_EXAMPLE_3 = [
  { 0: 'Tom Hardy', 1: 'Bane', 2: 'The Dark Knight Rises (2012)' },
  { 0: 'Aaron Eckhart', 1: 'Harvey Dent', 2: 'The Dark Knight (2008)' },
  { 0: 'Katie Holmes', 1: 'Rachel Dawes', 2: 'Batman Begins (2005)' },
  { 0: 'Kim Basinger', 1: 'Vicki Vale', 2: 'Batman (1989)' },
  { 0: 'Joaquin Phoenix', 1: 'Arthur Fleck', 2: 'Joker (2019)' },
  { 0: 'George Clooney', 1: 'Bruce Wayne', 2: 'Batman & Robin (1997)' },
  { 0: 'Danny DeVito', 1: 'The Penguin', 2: 'Batman Returns (1992)' },
  { 0: 'Jim Carrey', 1: 'Edward Nigma/Sphinx', 2: 'Batman Forever (1995)' },
  { 0: 'Zoe Kravitz', 1: 'Selina Kyle', 2: 'The Batman (2022)' },
  { 0: 'Jeremy Irons', 1: 'Alfred Pennyworth', 2: 'Batman v Superman (2016)' },
];

export default function SubmitMatchingQuestionForm({ userId, lang, ...props }) {
  const router = useRouter();

  const [submitMatchingQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, ...others } = values;
      const { matches, title, note, numCols } = details;
      const numRows = matches.length;

      const answer = matches.reduce((acc, row, index) => {
        acc[index] = row;
        return acc;
      }, {});

      const questionId = await submitQuestion(
        {
          details: { answer, title, note, numCols, numRows },
          type: QUESTION_TYPE,
          topic,
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
        numCols: MatchingQuestion.MIN_NUM_COLS,
        matches: [],
      }}
      onSubmit={async (values) => {
        await submitMatchingQuestion(values);
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
          title: stringSchema(MatchingQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(MatchingQuestion.NOTE_MAX_LENGTH, false),
          numCols: Yup.number()
            .min(
              MatchingQuestion.MIN_NUM_COLS,
              `Must be between ${MatchingQuestion.MIN_NUM_COLS} and ${MatchingQuestion.MAX_NUM_COLS}`
            )
            .max(
              MatchingQuestion.MAX_NUM_COLS,
              `Must be between ${MatchingQuestion.MIN_NUM_COLS} and ${MatchingQuestion.MAX_NUM_COLS}`
            )
            .required('Required.'),
        })}
        lang={lang}
      />

      {/* Step 2: Proposals */}
      <EnterMatchesStep onSubmit={() => {}} lang={lang} />
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
        placeholder={MATCHING_TITLE_EXAMPLE}
        validationSchema={validationSchema}
        maxLength={MatchingQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={QUESTION_HINTS_REMARKS[lang]}
        name="note"
        type="text"
        placeholder=""
        validationSchema={validationSchema}
        maxLength={MatchingQuestion.NOTE_MAX_LENGTH}
      />

      {/* <br />
            <br /> */}
      <MyNumberInput
        label={NUM_COLUMNS[lang]}
        name="numCols"
        min={MatchingQuestion.MIN_NUM_COLS}
        max={MatchingQuestion.MAX_NUM_COLS}
        // validationSchema={validationSchema}
      />
    </WizardStep>
  );
}

const NUM_COLUMNS = {
  en: 'Number of columns',
  'fr-FR': 'Nombre de colonnes',
};

const matchingItemsSchema = (numCols) => {
  // let row = []
  // for (let col = 0; col < numCols; col++) {
  //     row[col] = stringSchema(MATCHING_ITEM_MAX_LENGTH)
  // }
  return Yup.array()
    .of(Yup.array().of(stringSchema(MATCHING_ITEM_MAX_LENGTH)).length(numCols))
    .min(MatchingQuestion.MIN_NUM_ROWS, `There must be at least ${MatchingQuestion.MIN_NUM_ROWS} matches.`)
    .max(MatchingQuestion.MAX_NUM_ROWS, `There can be at most ${MatchingQuestion.MAX_NUM_ROWS} matches.`);
};

// Array.from({ length: numCols }, (_, i) => [i, '']).reduce((acc, [key, value]) => {
// acc[key] = value;
// return acc;
// }, {})

function EnterMatchesStep({ onSubmit, lang }) {
  const formik = useFormikContext();

  const values = formik.values;
  const errors = formik.errors;

  const MatchArrayErrors = () =>
    typeof errors.matches === 'string' && <StyledErrorMessage>{errors.matches}</StyledErrorMessage>;

  const MatchItemError = ({ col, row }) => {
    return (
      typeof errors.matches === 'array' &&
      errors.matches[row][col] && <StyledErrorMessage>{errors.matches[row][col]}</StyledErrorMessage>
    );
  };

  console.log('==============================================================');

  const matches = values.matches;
  console.log('Matches:', matches);
  console.log('Errors:', errors);

  const validationSchema = Yup.object({
    matches: matchingItemsSchema(values.numCols),
  });
  console.log('Validation schema', validationSchema);

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <p>
        {NUM_MATCHES_ALLOWED[lang]}: {MatchingQuestion.MIN_NUM_ROWS}-{MatchingQuestion.MAX_NUM_ROWS}.{' '}
      </p>

      <FieldArray name="matches">
        {({ remove, push }) => (
          <>
            {matches.length > 0 &&
              matches.map((match, row) => (
                <Box key={row} component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
                  <span className="text-lg">Match #{row + 1}</span>

                  <IconButton color="error" onClick={() => remove(row)}>
                    <DeleteIcon />
                  </IconButton>

                  {Array(values.numCols)
                    .fill(0)
                    .map((_, col) => (
                      <Fragment key={`${row}_${col}`}>
                        <MyTextInput
                          label={`${QUESTION_ITEM[lang]} #${col + 1}`}
                          name={`matches.${row}.${col}`}
                          type="text"
                          placeholder={itemPlaceholder(col, row, values.numCols)}
                          validationSchema={validationSchema}
                          maxLength={MatchingQuestion.ITEM_MAX_LENGTH}
                        />
                        <MatchItemError col={col} row={row} />
                      </Fragment>
                    ))}
                </Box>
              ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => push(Array.from({ length: values.numCols }, () => ''))}
            >
              {ADD_MATCH[lang]}
            </Button>
          </>
        )}
      </FieldArray>

      <MatchArrayErrors />
    </WizardStep>
  );
}

const NUM_MATCHES_ALLOWED = {
  en: 'Number of matches allowed',
  'fr-FR': 'Nombre de matchs autorisé',
};

const ADD_MATCH = {
  en: 'Add match',
  'fr-FR': 'Ajouter match',
};

const itemPlaceholder = (col, row, numCols) => {
  if (numCols === 2) return MATCHING_ANSWER_EXAMPLE_2[row % MATCHING_ANSWER_EXAMPLE_2.length][col];
  if (numCols === 3) return MATCHING_ANSWER_EXAMPLE_3[row % MATCHING_ANSWER_EXAMPLE_3.length][col];
  return `${QUESTION_ITEM[lang]} #${col + 1} of Matching #${row + 1}`;
};
