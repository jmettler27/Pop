import React from 'react';

import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';
import { useFormikContext } from 'formik';

interface SubmitFormButtonProps {
  isSubmitting: boolean;
  label: React.ReactNode;
}

export default function SubmitFormButton({ isSubmitting, label }: SubmitFormButtonProps) {
  {
    /* https://mui.com/material-ui/react-button/#loading-button */
  }

  const formik = useFormikContext();

  return (
    <Button
      // size='large'
      color="success"
      variant="contained"
      endIcon={<SendIcon />}
      disabled={isSubmitting || formik.isSubmitting}
      type="submit"
    >
      {label}
    </Button>
  );
}
