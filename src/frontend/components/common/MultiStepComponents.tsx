import React, { useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import { Form, Formik } from 'formik';
import type { FormikHelpers, FormikValues } from 'formik';
import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.forms.MultiStepComponents', {
  step: 'Step',
  previousStep: 'Previous step',
  nextStep: 'Next step',
});

interface WizardStepProps {
  children: React.ReactNode;
  onSubmit?: (values: FormikValues, bag: FormikHelpers<FormikValues>) => Promise<void> | void;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
}

interface WizardProps {
  children: React.ReactNode;
  initialValues: FormikValues;
  onSubmit: (values: FormikValues, bag: FormikHelpers<FormikValues>) => Promise<void> | void;
  isSubmitting: boolean;
  submitButtonLabel?: string;
}

// Wizard is a single Formik instance whose children are each page of the
// multi-step form. The form is submitted on each forward transition (can only
// progress with valid input), whereas a backwards step is allowed with
// incomplete data. A snapshot of form state is used as initialValues after each
// transition. Each page has an optional submit handler, and the top-level
// submit is called when the final page is submitted.
export const Wizard = ({
  children,
  initialValues,
  onSubmit,
  isSubmitting,
  submitButtonLabel = undefined,
}: WizardProps) => {
  const intl = useIntl();
  const [stepNumber, setStepNumber] = useState(0);
  const steps = React.Children.toArray(children) as React.ReactElement<WizardStepProps>[];
  const [snapshot, setSnapshot] = useState(initialValues);

  const step = steps[stepNumber];
  const totalSteps = steps.length;
  const isLastStep = stepNumber === totalSteps - 1;

  const next = (values: FormikValues) => {
    setSnapshot(values);
    setStepNumber(Math.min(stepNumber + 1, totalSteps - 1));
  };

  const previous = (values: FormikValues) => {
    setSnapshot(values);
    setStepNumber(Math.max(stepNumber - 1, 0));
  };

  const handleSubmit = async (values: FormikValues, bag: FormikHelpers<FormikValues>) => {
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
      {(formik) => (
        <Form>
          <p>
            {intl.formatMessage(messages.step)} {stepNumber + 1}/{totalSteps}
          </p>
          {step}
          <div className="flex">
            {stepNumber > 0 && <PreviousStepButton onClick={() => previous(formik.values)} />}
            {isLastStep ? (
              <SubmitFormButton isSubmitting={isSubmitting} label={submitButtonLabel} />
            ) : (
              <NextStepButton disabled={formik.isSubmitting} />
            )}
          </div>
          {/* <Debug /> */}
        </Form>
      )}
    </Formik>
  );
};

export const WizardStep = ({ children }: WizardStepProps) => children;

interface PreviousStepButtonProps {
  onClick: () => void;
}

function PreviousStepButton({ onClick }: PreviousStepButtonProps) {
  const intl = useIntl();
  return (
    <Button
      // size='large'
      color="inherit"
      onClick={onClick}
      variant="outlined"
      startIcon={<ArrowBackIcon />}
    >
      {intl.formatMessage(messages.previousStep)}
    </Button>
  );
}

interface NextStepButtonProps {
  disabled: boolean;
}

function NextStepButton({ disabled }: NextStepButtonProps) {
  const intl = useIntl();
  return (
    <Button
      // size='large'
      color="inherit"
      disabled={disabled}
      type="submit"
      variant="outlined"
      endIcon={<ArrowForwardIcon />}
    >
      {intl.formatMessage(messages.nextStep)}
    </Button>
  );
}
