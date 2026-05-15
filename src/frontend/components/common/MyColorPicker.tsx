import React from 'react';

import Sketch from '@uiw/react-color-sketch';
import { useField } from 'formik';
import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { StyledErrorMessage, StyledLabel } from '@/frontend/components/common/StyledFormComponents';
import { requiredIndicator } from '@/frontend/helpers/forms/forms';

interface MyColorPickerProps {
  label: string;
  validationSchema: ObjectSchema<Record<string, unknown>>;
  name: string;
  id?: string;
  [key: string]: unknown;
}

export default function MyColorPicker({ label, validationSchema, name, ...props }: MyColorPickerProps) {
  const [field, meta, helpers] = useField(name);
  const intl = useIntl();

  return (
    <div className="space-y-1">
      <StyledLabel htmlFor={(props.id as string | undefined) || name}>
        {requiredIndicator(validationSchema, 'string', field.name, intl)}
        {label}
      </StyledLabel>
      <Sketch
        color={field.value as string}
        // style={{ marginTop: 10, width: 140 }}
        // showEyeDropper={false}
        // showColorPreview={false}
        // showEditableInput={false}
        onChange={(color) => {
          helpers.setValue(color.hex);
        }}
      />
      {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
    </div>
  );
}
