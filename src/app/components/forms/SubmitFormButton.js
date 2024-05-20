import React from 'react';
import { useFormikContext } from 'formik';

import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';



export default function SubmitFormButton({ isSubmitting, text = DEFAULT_SUBMIT_BUTTON_TEXT['fr-FR'] }) {
    {/* https://mui.com/material-ui/react-button/#loading-button */ }

    const formik = useFormikContext();

    return (
        <Button
            // size='large'
            color='success'
            variant='contained'
            endIcon={<SendIcon />}
            disabled={isSubmitting || formik.isSubmitting}
            type='submit'
        >
            {text}
        </Button>
    )
}

const DEFAULT_SUBMIT_BUTTON_TEXT = {
    'en': 'Submit',
    'fr-FR': 'Envoyer',
}