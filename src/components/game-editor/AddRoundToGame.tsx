import { useState } from 'react';

import { Form, Formik } from 'formik';
import { CirclePlus } from 'lucide-react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

import { addRound, type QuestionType } from '@/api';
import SelectRoundType from '@/components/common/SelectRoundType';
import { MyTextInput } from '@/components/common/StyledFormComponents';
import SubmitFormButton from '@/components/common/SubmitFormButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { stringSchema } from '@/helpers/forms/forms';
import { roundTypeSchema } from '@/helpers/forms/game';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { Round } from '@/models/rounds/round';
import { RoundType } from '@/models/rounds/round-type';

const messages = defineMessages('frontend.gameEditor.AddRoundToGame', {
  addRound: 'Add round',
  createNewRound: 'Create new round',
  roundTitle: 'Title of the round',
});

interface AddRoundToGameButtonProps {
  disabled: boolean;
}

export function AddRoundToGameButton({ disabled }: AddRoundToGameButtonProps) {
  const intl = useIntl();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full">
        <Button
          className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          size="lg"
          variant="outline"
          style={{
            border: '2.5px dashed',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
          }}
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
        >
          <CirclePlus className="mr-2 size-4" />
          {intl.formatMessage(messages.addRound)}
        </Button>
      </div>
      <CreateRoundFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}

interface CreateRoundFormDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateRoundFormDialog({ open, onClose }: CreateRoundFormDialogProps) {
  const intl = useIntl();
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{intl.formatMessage(messages.createNewRound)}</DialogTitle>
        </DialogHeader>
        <CreateRoundForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

interface CreateRoundFormProps {
  onClose: () => void;
}

interface CreateRoundFormValues {
  type: RoundType;
  title: string;
}

function CreateRoundForm({ onClose }: CreateRoundFormProps) {
  const intl = useIntl();
  const gameId = useGameId();

  const [submitRound, isSubmitting] = useAsyncAction(async (values: CreateRoundFormValues) => {
    try {
      const { type, title } = values;
      // A round's type is the question type it holds; the Go API rejects `mixed` (out of scope).
      await addRound(gameId, { title, type: type as QuestionType });
    } catch (error) {
      console.error('Failed to create the round:', error);
      throw error;
    }
    onClose();
  });

  const validationSchema = Yup.object({
    type: roundTypeSchema(),
    title: stringSchema(Round.TITLE_MAX_LENGTH),
  });

  return (
    <Formik<CreateRoundFormValues>
      initialValues={{
        type: '' as RoundType,
        title: '',
      }}
      onSubmit={async (values) => await submitRound(values)}
      validationSchema={validationSchema}
    >
      <Form>
        <SelectRoundType name="type" validationSchema={validationSchema} />

        <MyTextInput
          label={intl.formatMessage(messages.roundTitle)}
          name="title"
          type="text"
          validationSchema={validationSchema}
          maxLength={Round.TITLE_MAX_LENGTH}
        />

        <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(globalMessages.create)} />
      </Form>
    </Formik>
  );
}
