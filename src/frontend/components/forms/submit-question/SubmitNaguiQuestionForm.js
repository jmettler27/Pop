import { QuestionType } from '@/backend/models/questions/QuestionType';
import { NaguiQuestion } from '@/backend/models/questions/Nagui';

import { submitQuestion } from '@/backend/services/question-creator/actions';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import { topicSchema } from '@/frontend/utils/forms/topics';
import {
  QUESTION_EXPLANATION_LABEL,
  QUESTION_HINTS_REMARKS,
  QUESTION_SOURCE_LABEL,
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
import { Field, FieldArray, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import Box from '@mui/system/Box';

const QUESTION_TYPE = QuestionType.NAGUI;

const NAGUI_CHOICES_EXAMPLE = ['101', '303', '404', '506'];

const NAGUI_SOURCE_EXAMPLE = {
  en: 'The Matrix',
  'fr-FR': 'Matrix',
};

const NAGUI_TITLE_EXAMPLE = {
  en: "What is Neo's room number?",
  'fr-FR': 'Quel est le numéro de chambre de Neo ?',
};

const NAGUI_NOTE_EXAMPLE = '';

const NAGUI_EXPLANATION_EXAMPLE = {
  en: "101 is an allusion to Neo's destiny as the One. 101 is also the number usually attributed to a course or manual for beginners in a particular field (in this case it represents the beginning of Neo's path to hacker enlightenment). It can also be seen as an allusion to the Room 101 of George Orwell's novel 'Nineteen Eighty-Four'. It is a torture chamber in the 'Ministry of Love' in which a prisoner is subjected to his or her own worst nightmare, fear or phobia.",
  'fr-FR':
    "101 est une allusion au destin de Neo en tant que l'Unique. 101 est également le nombre généralement attribué à un cours ou à un manuel destiné aux débutants dans un domaine particulier (dans ce cas, il représente le début du chemin de Neo vers l'illumination du pirate informatique). On peut également y voir une allusion à la salle 101 du roman '1984' de George Orwell. Il s'agit d'une chambre de torture du 'Ministère de l'Amour' dans laquelle un prisonnier est soumis à son pire cauchemar, à sa peur ou à sa phobie,",
};

export default function SubmitNaguiQuestionForm({ userId, lang, ...props }) {
  const router = useRouter();

  const [submitNaguiQuestion, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { topic, lang, duoIdx, ...rest } = values;
      const details = { duoIdx, ...rest };
      const questionId = await submitQuestion(
        {
          details,
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
        source: '',
        title: '',
        note: '',
        explanation: '',
        choices: Array(NaguiQuestion.MAX_NUM_CHOICES).fill(''),
        answerIdx: -1,
        duoIdx: -1,
        // imageFiles: '',
        // audioFiles: ''
      }}
      onSubmit={async (values) => {
        await submitNaguiQuestion(values);
        if (props.inSubmitPage) {
          router.push('/submit');
        } else if (props.inGameEditor) {
          props.onDialogClose();
        }
      }}
      isSubmitting={isSubmitting}
    >
      <GeneralInfoStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          lang: localeSchema(),
          topic: topicSchema(),
          source: stringSchema(NaguiQuestion.SOURCE_MAX_LENGTH, false),
          title: stringSchema(NaguiQuestion.TITLE_MAX_LENGTH),
          note: stringSchema(NaguiQuestion.NOTE_MAX_LENGTH, false),
        })}
        lang={lang}
      />

      <EnterChoicesStep
        onSubmit={() => {}}
        validationSchema={Yup.object({
          choices: Yup.array()
            .of(stringSchema(NaguiQuestion.CHOICE_MAX_LENGTH))
            .length(NaguiQuestion.MAX_NUM_CHOICES, `There must be exactly ${NaguiQuestion.MAX_NUM_CHOICES} choices`)
            .required('Required.'),
          answerIdx: Yup.number()
            .min(0, 'Required.')
            .max(NaguiQuestion.MAX_NUM_CHOICES - 1, 'Required.')
            .required('Required.'),
          explanation: stringSchema(NaguiQuestion.EXPLANATION_MAX_LENGTH, false),
          duoIdx: Yup.number()
            .min(0, 'Required.')
            .max(NaguiQuestion.MAX_NUM_CHOICES - 1, 'Required.')
            .required('Required.'),
          // .test(
          //     "same-as-answer",
          //     "Must be different that the answer",
          //     () => {
          //         return this.parent.answerIdx !== this.parent.duoIdx
          //     })
        })}
        lang={lang}
      >
        {/* TODO */}
      </EnterChoicesStep>
    </Wizard>
  );
}

function GeneralInfoStep({ onSubmit, validationSchema, lang }) {
  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <SelectLanguage lang={lang} name="lang" validationSchema={validationSchema} />

      <SelectQuestionTopic lang={lang} name="topic" validationSchema={validationSchema} />

      <MyTextInput
        // label={`${stringRequiredAsterisk(validationSchema, 'source')}To what work is this question related to? ${numCharsIndicator(values['source'], NAGUI_SOURCE_MAX_LENGTH)}`}
        label={QUESTION_SOURCE_LABEL[lang]}
        name="source"
        type="text"
        placeholder={NAGUI_SOURCE_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.SOURCE_MAX_LENGTH}
      />

      <MyTextInput
        label={QUESTION_TITLE_LABEL[lang]}
        name="title"
        type="text"
        placeholder={NAGUI_TITLE_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.TITLE_MAX_LENGTH}
      />

      <MyTextInput
        label={QUESTION_HINTS_REMARKS[lang]}
        name="note"
        type="text"
        placeholder={NAGUI_NOTE_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.NOTE_MAX_LENGTH}
      />
    </WizardStep>
  );
}

function EnterChoicesStep({ onSubmit, validationSchema, lang }) {
  const formik = useFormikContext();

  const values = formik.values;
  const errors = formik.errors;

  const ChoiceArrayErrors = () =>
    typeof errors.choices === 'string' && <StyledErrorMessage>{errors.choices}</StyledErrorMessage>;

  const ChoiceError = ({ index }) => {
    const [field, meta] = useField(`choices.${index}`);
    return (
      typeof errors.choices === 'object' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <FieldArray name="choices">
        <Box component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '500px' }}>
          {values.choices.map((_item, index) => (
            <div key={index}>
              <label htmlFor={`choices.${index}`}>
                {NaguiQuestion.CHOICES[index]} ({values.choices[index].length}/{NaguiQuestion.CHOICE_MAX_LENGTH})
              </label>
              <Field name={`choices.${index}`} type="text" placeholder={NAGUI_CHOICES_EXAMPLE[index]} />
              <ChoiceError index={index} />
            </div>
          ))}
        </Box>
      </FieldArray>
      <ChoiceArrayErrors />

      <MySelect
        label={NAGUI_ANSWER_IDX_LABEL[lang]}
        name="answerIdx"
        validationSchema={validationSchema}
        onChange={(e) => formik.setFieldValue('answerIdx', parseInt(e.target.value, 10))}
      >
        <option value="">{SELECT_PROPOSAL[lang]}</option>
        {values.choices.map((choice, index) => (
          <option key={index} value={index}>
            {NaguiQuestion.CHOICES[index]}. {choice}
          </option>
        ))}
      </MySelect>

      <MyTextInput
        label={QUESTION_EXPLANATION_LABEL[lang]}
        name="explanation"
        type="text"
        placeholder={NAGUI_EXPLANATION_EXAMPLE[lang]}
        validationSchema={validationSchema}
        maxLength={NaguiQuestion.EXPLANATION_MAX_LENGTH}
      />

      {values.answerIdx >= 0 && (
        <MySelect
          label={NAGUI_DUO_IDX_LABEL[lang]}
          name="duoIdx"
          validationSchema={validationSchema}
          onChange={(e) => formik.setFieldValue('duoIdx', parseInt(e.target.value, 10))}
        >
          <option value="">{SELECT_PROPOSAL[lang]}</option>
          {values.choices.map(
            (choice, index) =>
              index !== values.answerIdx && (
                <option key={index} value={index}>
                  {NaguiQuestion.CHOICES[index]}. {choice}
                </option>
              )
          )}
        </MySelect>
      )}
    </WizardStep>
  );
}

const NAGUI_ANSWER_IDX_LABEL = {
  en: 'What proposal is the correct one ?',
  'fr-FR': 'Quelle proposition est la bonne?',
};

const NAGUI_DUO_IDX_LABEL = {
  en: 'What other proposal do you want for the duo?',
  'fr-FR': 'Quelle autre proposition voulez-vous pour le duo ?',
};
