import { useState } from 'react';
import { useParams } from 'next/navigation';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Form, Formik } from 'formik';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

import { Round } from '@/backend/models/rounds/Round';
import { addRoundToGame } from '@/backend/services/edit-game/actions';
import SelectRoundType from '@/frontend/components/common/SelectRoundType';
import { MyNumberInput, MyTextInput } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { stringSchema } from '@/frontend/helpers/forms/forms';
import { roundTypeSchema } from '@/frontend/helpers/forms/game';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import globalMessages from '@/i18n/globalMessages';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.gameEditor.AddNewRound', {
  addRound: 'Add round',
  createNewRound: 'Create new round',
  roundTitle: 'Title of the round',
});

export function AddNewRoundButton({ disabled }) {
  const intl = useIntl();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full">
        <Button
          className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          size="large"
          variant="outlined"
          color="primary"
          style={{
            border: '2.5px dashed',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
          }}
          startIcon={<AddCircleOutlineIcon />}
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
        >
          {intl.formatMessage(messages.addRound)}
        </Button>
      </div>
      <CreateRoundFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}

function CreateRoundFormDialog({ open, onClose }) {
  const intl = useIntl();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{intl.formatMessage(messages.createNewRound)}</DialogTitle>
      <DialogContent>
        <CreateRoundForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function CreateRoundForm({ onClose }) {
  const intl = useIntl();
  const { id: gameId } = useParams();

  const [submitRound, isSubmitting] = useAsyncAction(async (values) => {
    try {
      const { type, title } = values;
      await addRoundToGame(gameId, title, type);
    } catch (error) {
      console.error('Failed to create the round:', error);
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
        <SelectRoundType label="Type" name="type" validationSchema={validationSchema} />

        <MyTextInput
          label={intl.formatMessage(messages.roundTitle)}
          name="title"
          type="text"
          validationSchema={validationSchema}
          maxLength={Round.TITLE_MAX_LENGTH}
        />

        {/* <MyNumberInput label={intl.formatMessage(messages.rewardsPerQuestion)} name='rewardsPerQuestion' min={1} max={10} /> */}

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(globalMessages.create)} />
      </Form>
    </Formik>
  );
}
