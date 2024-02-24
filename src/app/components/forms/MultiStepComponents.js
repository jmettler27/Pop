import React, { useState } from 'react';
import { Form, Formik } from 'formik';

import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';

import SubmitFormButton from './SubmitFormButton';

// Wizard is a single Formik instance whose children are each page of the
// multi-step form. The form is submitted on each forward transition (can only
// progress with valid input), whereas a backwards step is allowed with
// incomplete data. A snapshot of form state is used as initialValues after each
// transition. Each page has an optional submit handler, and the top-level
// submit is called when the final page is submitted.
export const Wizard = ({ children, initialValues, onSubmit, isSubmitting }) => {
    const [stepNumber, setStepNumber] = useState(0);
    const steps = React.Children.toArray(children);
    const [snapshot, setSnapshot] = useState(initialValues);

    const step = steps[stepNumber];
    const totalSteps = steps.length;
    const isLastStep = stepNumber === totalSteps - 1;

    const next = values => {
        setSnapshot(values);
        setStepNumber(Math.min(stepNumber + 1, totalSteps - 1));
    };

    const previous = values => {
        setSnapshot(values);
        setStepNumber(Math.max(stepNumber - 1, 0));
    };

    const handleSubmit = async (values, bag) => {
        if (step.props.onSubmit) {
            await step.props.onSubmit(values, bag);
        }
        if (isLastStep) {
            return onSubmit(values, bag);
        } else {
            bag.setTouched({});
            next(values);
        }
    };

    return (
        <Formik
            initialValues={snapshot}
            onSubmit={handleSubmit}
            validationSchema={step.props.validationSchema}
            enableReinitialize={true}
        >
            {formik => (
                <Form>
                    <p>
                        Step {stepNumber + 1} of {totalSteps}
                    </p>
                    {step}
                    <div className='flex'>
                        {stepNumber > 0 &&
                            <PreviousStepButton onClick={() => previous(formik.values)} />
                        }
                        {isLastStep ?
                            <SubmitFormButton isSubmitting={isSubmitting} /> :
                            <NextStepButton disabled={formik.isSubmitting} />
                        }
                    </div>
                    {/* <Debug /> */}
                </Form>
            )}
        </Formik>
    );
};

export const WizardStep = ({ children }) => children;


function PreviousStepButton({ onClick }) {
    return (
        <Button
            // size='large'
            color='inherit'
            onClick={onClick}
            variant='outlined'
            startIcon={<ArrowBackIcon />}
        >
            Previous step
        </Button>
    )
}

function NextStepButton({ disabled }) {
    return (
        <Button
            // size='large'
            color='inherit'
            disabled={disabled}
            type='submit'
            variant='outlined'
            endIcon={<ArrowForwardIcon />}
        >
            Next step
        </Button>
    )
}

// function SubmitFormButton({ disabled }) {
//     {/* https://mui.com/material-ui/react-button/#loading-button */ }

//     return (
//         <Button
//             // size='large'
//             color='success'
//             variant='contained'
//             endIcon={<SendIcon />}
//             disabled={disabled}
//             type='submit'
//         >
//             Submit
//         </Button>
//     )
// }