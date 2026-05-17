import React, { Fragment } from 'react';
import { useRouter } from 'next/navigation';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, IconButton } from '@mui/material';
import Box from '@mui/system/Box';
import { FieldArray, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { ObjectSchema } from 'yup';

import { editQuestion, submitQuestion } from '@/backend/services/create-question/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import { Wizard, WizardStep } from '@/frontend/components/common/MultiStepComponents';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectQuestionTopic from '@/frontend/components/common/SelectQuestionTopic';
import { MyNumberInput, MyTextInput, StyledErrorMessage } from '@/frontend/components/common/StyledFormComponents';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { messages as questionMessages } from '@/frontend/helpers/forms/questions';
import { topicSchema } from '@/frontend/helpers/forms/topics';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import { MatchingQuestion } from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.forms.submitQuestion.matching', {
  numColumns: 'Number of columns',
  numMatchesAllowed: 'Number of matches allowed',
  addMatch: 'Add match',
});

const QUESTION_TYPE = QuestionType.MATCHING;

const MATCHING_TITLE_EXAMPLE = 'Link these houses of Westeros to their seat';

const MATCHING_ANSWER_EXAMPLE_2: Record<number, string>[] = [
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

const MATCHING_ANSWER_EXAMPLE_3: Record<number, string>[] = [
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

interface MatchingFormValues {
  lang: string;
  topic: string;
  title: string;
  note: string;
  numCols: number;
  matches: string[][];
}

interface QuestionFormProps {
  userId?: string;
  questionToEdit?: Record<string, unknown>;
  inGameEditor?: boolean;
  inSubmitPage?: boolean;
  gameId?: string;
  roundId?: string;
  onDialogClose?: () => void;
}

export default function SubmitMatchingQuestionForm({ userId, ...props }: QuestionFormProps) {
  const router = useRouter();
  const q = props.questionToEdit as Record<string, unknown> | undefined;

  const [submitMatchingQuestion, isSubmitting] = useAsyncAction(async (values: MatchingFormValues) => {
    try {
      const { topic, lang, ...others } = values;
      const { matches, title, note, numCols } = others;
      const numRows = matches.length;

      const answer = matches.reduce<Record<number, string[]>>((acc, row, index) => {
        acc[index] = row;
        return acc;
      }, {});

      if (q) {
        await editQuestion(
          { details: { answer, title, note, numCols, numRows }, type: QUESTION_TYPE, topic, lang },
          q.id as string
        );
      } else {
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
      }
    } catch (error) {
      console.error('Failed to submit your question:', error);
    }
  });

  const qAnswer = q?.answer as Record<string, string[]> | undefined;

  return (
    <Wizard
      key={(q?.id as string) ?? 'new'}
      initialValues={
        q
          ? {
              lang: (q.lang as string) || DEFAULT_LOCALE,
              topic: (q.topic as string) || '',
              title: (q.title as string) || '',
              note: (q.note as string) || '',
              numCols: (q.numCols as number) || MatchingQuestion.MIN_NUM_COLS,
              matches: qAnswer
                ? Object.keys(qAnswer)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((k) => qAnswer[k])
                : [],
            }
          : {
              lang: DEFAULT_LOCALE,
              topic: '',
              title: '',
              note: '',
              numCols: MatchingQuestion.MIN_NUM_COLS,
              matches: [],
            }
      }
      onSubmit={async (values) => {
        await submitMatchingQuestion(values as MatchingFormValues);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose?.();
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
      />

      {/* Step 2: Proposals */}
      <EnterMatchesStep onSubmit={() => {}} />
    </Wizard>
  );
}

interface StepProps {
  onSubmit: () => void;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  children?: React.ReactNode;
}

function GeneralInfoStep({ onSubmit, validationSchema }: StepProps) {
  const intl = useIntl();
  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <SelectLanguage name="lang" validationSchema={validationSchema} />

      <SelectQuestionTopic name="topic" validationSchema={validationSchema} />

      <MyTextInput
        label={intl.formatMessage(questionMessages.questionTitle)}
        name="title"
        type="text"
        placeholder={MATCHING_TITLE_EXAMPLE}
        validationSchema={validationSchema}
        maxLength={MatchingQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={intl.formatMessage(questionMessages.hintsRemarks)}
        name="note"
        type="text"
        placeholder=""
        validationSchema={validationSchema}
        maxLength={MatchingQuestion.NOTE_MAX_LENGTH}
      />

      <MyNumberInput
        label={intl.formatMessage(messages.numColumns)}
        name="numCols"
        min={MatchingQuestion.MIN_NUM_COLS}
        max={MatchingQuestion.MAX_NUM_COLS}
        // validationSchema={validationSchema}
      />
    </WizardStep>
  );
}

const matchingItemsSchema = (numCols: number) => {
  return Yup.array()
    .of(Yup.array().of(stringSchema(MatchingQuestion.ITEM_MAX_LENGTH)).length(numCols))
    .min(MatchingQuestion.MIN_NUM_ROWS, `There must be at least ${MatchingQuestion.MIN_NUM_ROWS} matches.`)
    .max(MatchingQuestion.MAX_NUM_ROWS, `There can be at most ${MatchingQuestion.MAX_NUM_ROWS} matches.`);
};

function EnterMatchesStep({ onSubmit }: { onSubmit: () => void }) {
  const intl = useIntl();
  const formik = useFormikContext<MatchingFormValues>();

  const values = formik.values;
  const errors = formik.errors;

  const MatchArrayErrors = () =>
    typeof errors.matches === 'string' && <StyledErrorMessage>{errors.matches}</StyledErrorMessage>;

  const MatchItemError = ({ col, row }: { col: number; row: number }) => {
    const matchErrors = errors.matches as (string[] | undefined)[] | undefined;
    return (
      Array.isArray(matchErrors) &&
      matchErrors[row] &&
      (matchErrors[row] as string[])[col] && (
        <StyledErrorMessage>{(matchErrors[row] as string[])[col]}</StyledErrorMessage>
      )
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
        {intl.formatMessage(messages.numMatchesAllowed)}: {MatchingQuestion.MIN_NUM_ROWS}-
        {MatchingQuestion.MAX_NUM_ROWS}.{' '}
      </p>

      <FieldArray name="matches">
        {({ remove, push }) => (
          <>
            {matches.length > 0 &&
              matches.map((_match, row) => (
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
                          label={`${intl.formatMessage(questionMessages.item)} #${col + 1}`}
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
              {intl.formatMessage(messages.addMatch)}
            </Button>
          </>
        )}
      </FieldArray>

      <MatchArrayErrors />
    </WizardStep>
  );
}

const itemPlaceholder = (col: number, row: number, numCols: number): string => {
  if (numCols === 2) return MATCHING_ANSWER_EXAMPLE_2[row % MATCHING_ANSWER_EXAMPLE_2.length][col];
  if (numCols === 3) return MATCHING_ANSWER_EXAMPLE_3[row % MATCHING_ANSWER_EXAMPLE_3.length][col];
  return `Item #${col + 1} of Match #${row + 1}`;
};
