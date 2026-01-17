import { addRoundToGame } from '@/backend/services/edit-game/actions';

import { Round } from '@/backend/models/rounds/Round';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { stringSchema } from '@/frontend/utils/forms/forms';
import { roundTypeSchema } from '@/frontend/utils/forms/game';

import SelectRoundType from '@/frontend/components/forms/SelectRoundType';
import { MyNumberInput, MyTextInput } from '@/frontend/components/forms/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';

import { useParams } from 'next/navigation';

import { useState } from 'react';

import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { Form, Formik } from 'formik';

import * as Yup from 'yup';

export function AddNewRoundButton({ disabled, lang = DEFAULT_LOCALE }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full">
        <Button
          className=""
          size="large"
          variant="outlined"
          style={{ border: '2.5px dashed', fontSize: '1rem' }}
          startIcon={<AddCircleOutlineIcon />}
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
        >
          {ADD_ROUND[lang]}
        </Button>
      </div>
      <CreateRoundFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} lang={lang} />
    </>
  );
}

const ADD_ROUND = {
  en: 'Add round',
  'fr-FR': 'Ajouter manche',
};

function CreateRoundFormDialog({ open, onClose, lang }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{ADD_NEW_ROUND_TITLE[lang]}</DialogTitle>
      <DialogContent>
        <CreateRoundForm onClose={onClose} lang={lang} />
      </DialogContent>
    </Dialog>
  );
}

const ADD_NEW_ROUND_TITLE = {
  en: 'Create new round',
  'fr-FR': 'Créer une nouvelle manche',
};

function CreateRoundForm({ onClose, lang }) {
  const { id: gameId } = useParams();

  const [submitRound, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { type, title } = values;
      await addRoundToGame(gameId, title, type);
    } catch (error) {
      console.error('There was an error creating the round:', error);
      throw error;
    }
    onClose();
  });

  const validationSchema = Yup.object({
    type: roundTypeSchema(),
    title: stringSchema(Round.TITLE_MAX_LENGTH),
    // rewards: Yup.array().of(
    //     Yup.number()
    //         .required()
    //         .integer()
    //         .min(1)
    //         .max(10)
    // ),
    // rewardsPerQuestion: Yup.number()
    //     .required()
    //     .integer()
    //     .min(1)
    //     .max(10),
  });

  return (
    <Formik
      initialValues={{
        type: '',
        title: '',
        // rewards: GAME_ROUND_REWARDS,
        // rewardsPerQuestion: 1
      }}
      onSubmit={async (values) => await submitRound(values, gameId)}
      validationSchema={validationSchema}
    >
      <Form>
        <SelectRoundType label="Type" name="type" validationSchema={validationSchema} lang={lang} />

        <MyTextInput
          label={ROUND_TITLE_LABEL[lang]}
          name="title"
          type="text"
          validationSchema={validationSchema}
          maxLength={Round.TITLE_MAX_LENGTH}
        />

        {/* <MyNumberInput label={ROUND_REWARDS_PER_QUESTION_LABEL[lang]} name='rewardsPerQuestion' min={1} max={10} /> */}

        <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_BUTTON_LABEL[lang]} />
      </Form>
    </Formik>
  );
}

const ROUND_TITLE_LABEL = {
  en: 'Title of the round',
  'fr-FR': 'Titre de la manche',
};

// const ROUND_REWARDS_PER_QUESTION_LABEL = {
//     'en': "Rewards per question",
//     'fr-FR': "Points par question"
// }

const SUBMIT_BUTTON_LABEL = {
  en: 'Create',
  'fr-FR': 'Créer',
};
