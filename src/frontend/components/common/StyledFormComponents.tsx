import React from 'react';

import styled from '@emotion/styled';
import { Field, useField, useFormikContext } from 'formik';
import type { ObjectSchema } from 'yup';

import '@/app/submit/styles.css';
import '@/app/submit/styles-custom.css';

import { useIntl } from 'react-intl';

import { NumberInput } from '@/frontend/components/common/NumberInput';
import { numEmojisIndicator } from '@/frontend/helpers/forms/emojis';
import {
  numCharsIndicator,
  requiredFieldIndicator,
  requiredIndicator,
  requiredIndicatorString,
  type YupObjectSchema,
} from '@/frontend/helpers/forms/forms';

interface MyTextInputProps {
  label: string;
  maxLength?: number;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  fieldType?: string;
  onlyEmojis?: boolean;
  name: string;
  id?: string;
  type?: string;
  [key: string]: unknown;
}

export function MyTextInput({
  label,
  maxLength,
  validationSchema,
  fieldType = 'string',
  onlyEmojis,
  ...props
}: MyTextInputProps) {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  // which we can spread on <input> and alse replace ErrorMessage entirely.
  const [field, meta] = useField(props as { name: string });
  const intl = useIntl();

  // const maxLength = validationSchema.fields[field.name].tests.find(test => test.OPTIONS.name === 'max')?.OPTIONS.params.max || 0
  return (
    <>
      <StyledLabel htmlFor={(props.id as string | undefined) || field.name}>
        {validationSchema ? requiredIndicator(validationSchema as YupObjectSchema, fieldType, field.name, intl) : ''}
        {label}{' '}
        {maxLength != null &&
          maxLength > 0 &&
          (onlyEmojis
            ? numEmojisIndicator(field.value as string, maxLength)
            : numCharsIndicator(field.value as string, maxLength))}
      </StyledLabel>
      <input
        className="text-input text-xs sm:text-sm md:text-base"
        {...field}
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        value={(field.value as string) || ''}
      />
      {meta.touched && meta.error && <div className="error text-xs sm:text-sm">{meta.error}</div>}
    </>
  );
}

interface MyCheckboxProps {
  children?: React.ReactNode;
  name: string;
  id?: string;
  [key: string]: unknown;
}

export function MyCheckbox({ children, ...props }: MyCheckboxProps) {
  const [field, meta] = useField({ ...props, type: 'checkbox' } as { name: string; type: 'checkbox' });
  return (
    <>
      <label className="checkbox text-xs sm:text-sm md:text-base">
        <input
          {...field}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          type="checkbox"
          value={(field.value as string) || ''}
        />
        {children}
      </label>
      {meta.touched && meta.error && <div className="error text-xs sm:text-sm">{meta.error}</div>}
    </>
  );
}

// Styled components ....
const StyledSelect = styled.select`
  color: var(--blue);
  font-size: clamp(0.75rem, 1vw, 1rem);
`;

export const StyledErrorMessage = styled.div`
  font-size: clamp(0.75rem, 1vw, 0.875rem);
  color: var(--red-600);
  width: 100%;
  max-width: 400px;
  margin-top: 0.25rem;
  &:before {
    content: '❌ ';
    font-size: clamp(0.625rem, 0.8vw, 0.75rem);
  }
  @media (prefers-color-scheme: dark) {
    color: var(--red-300);
  }
`;

export const StyledLabel = styled.label`
  margin-top: 1rem;
  font-size: clamp(0.875rem, 1.2vw, 1rem);
  display: block;
`;

interface MySelectProps {
  label: string;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  children?: React.ReactNode;
  name: string;
  id?: string;
  [key: string]: unknown;
}

export function MySelect({ label, validationSchema, children, ...props }: MySelectProps) {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  // which we can spread on <input> and alse replace ErrorMessage entirely.
  const [field, meta] = useField(props as { name: string });
  const intl = useIntl();

  return (
    <>
      <StyledLabel htmlFor={(props.id as string | undefined) || field.name}>
        {validationSchema ? requiredFieldIndicator(validationSchema as YupObjectSchema, field.name, intl) : ''}
        {label}
      </StyledLabel>
      <StyledSelect
        className="text-xs sm:text-sm 2xl:text-base dark:text-white"
        {...field}
        {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      >
        {children}
      </StyledSelect>
      {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
    </>
  );
}

interface MyNumberInputProps {
  label: string;
  name: string;
  min: number;
  max: number;
  id?: string;
  [key: string]: unknown;
}

export function MyNumberInput({ label, name, min, max, ...props }: MyNumberInputProps) {
  const intl = useIntl();
  const formik = useFormikContext();
  const [field, meta, helpers] = useField(name);

  return (
    <>
      <StyledLabel htmlFor={(props.id as string | undefined) || name}>
        {requiredIndicatorString(true, intl)}
        {label} ({min}-{max})
      </StyledLabel>
      <NumberInput
        name={field.name}
        value={field.value as number}
        min={min}
        max={max}
        onChange={(newValue: number | null) => {
          helpers.setValue(newValue);
        }}
        onBlur={formik.handleBlur}
        error={meta.touched && !!meta.error}
        style={{ width: '200px' }}
      />
      {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
    </>
  );
}

interface MyRadioGroupProps {
  label: string;
  name: string;
  trueText: string;
  falseText: string;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  [key: string]: unknown;
}

export function MyRadioGroup({ label, name, trueText, falseText, validationSchema, ...props }: MyRadioGroupProps) {
  const [field, meta, helpers] = useField(name);

  return (
    <>
      <span>
        {label} {(field.value as boolean | null) !== null && <strong>{field.value ? trueText : falseText}</strong>}
      </span>
      <div role="group" aria-labelledby="radio-group" className="flex flex-row space-x-2">
        <label>
          <Field type="radio" name="picked" value={trueText} onClick={() => helpers.setValue(true)} />
          {trueText}
        </label>
        <label>
          <Field type="radio" name="picked" value={falseText} onClick={() => helpers.setValue(false)} />
          {falseText}
        </label>
      </div>
      {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
    </>
  );
}
