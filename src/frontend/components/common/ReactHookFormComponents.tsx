import React from 'react';

import { useController, useFormContext } from 'react-hook-form';
import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { NumberInput } from '@/frontend/components/common/NumberInput';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import {
  numCharsIndicator,
  requiredFieldIndicator,
  requiredIndicator,
  requiredIndicatorString,
  type YupObjectSchema,
} from '@/frontend/helpers/forms/forms';

interface FieldProps {
  label: string;
  name: string;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  id?: string;
}

function ErrorText({ children }: { children?: React.ReactNode }) {
  return children ? <div className="mt-1 max-w-[400px] text-sm text-destructive">{children}</div> : null;
}

export function ReactHookFormTextInput({
  label,
  maxLength,
  validationSchema,
  ...props
}: FieldProps & {
  maxLength?: number;
  type?: string;
  placeholder?: string;
}) {
  const { field, fieldState } = useController({ name: props.name });
  const intl = useIntl();

  return (
    <>
      <label className="mt-4 block text-[clamp(0.875rem,1.2vw,1rem)] font-medium" htmlFor={props.id || field.name}>
        {validationSchema ? requiredIndicator(validationSchema as YupObjectSchema, 'string', field.name, intl) : ''}
        {label} {maxLength ? numCharsIndicator(field.value || '', maxLength) : null}
      </label>
      <Input
        {...field}
        {...props}
        id={props.id || field.name}
        value={field.value || ''}
        className="text-xs sm:text-sm md:text-base"
        aria-invalid={fieldState.invalid}
      />
      <ErrorText>{fieldState.error?.message}</ErrorText>
    </>
  );
}

export function ReactHookFormSelect({
  label,
  validationSchema,
  children,
  ...props
}: FieldProps & {
  children: React.ReactNode;
}) {
  const { field, fieldState } = useController({ name: props.name });
  const intl = useIntl();
  const items = React.Children.toArray(children)
    .filter(React.isValidElement<{ value: string; children?: React.ReactNode }>)
    .map((item) => ({ value: item.props.value, label: item.props.children }));

  return (
    <>
      <label className="mt-4 block text-[clamp(0.875rem,1.2vw,1rem)] font-medium" htmlFor={props.id || field.name}>
        {validationSchema ? requiredFieldIndicator(validationSchema as YupObjectSchema, field.name, intl) : ''}
        {label}
      </label>
      <Select
        items={items}
        name={field.name}
        value={field.value || ''}
        onValueChange={(value) => field.onChange(value || '')}
      >
        <SelectTrigger
          id={props.id || field.name}
          onBlur={field.onBlur}
          className="w-full max-w-[400px] cursor-pointer"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      <ErrorText>{fieldState.error?.message}</ErrorText>
    </>
  );
}

export function ReactHookFormNumberInput({ label, name, min, max }: FieldProps & { min: number; max: number }) {
  const { field, fieldState } = useController({ name });
  const intl = useIntl();

  return (
    <>
      <label className="mt-4 block text-[clamp(0.875rem,1.2vw,1rem)] font-medium" htmlFor={name}>
        {requiredIndicatorString(true, intl)}
        {label} ({min}-{max})
      </label>
      <NumberInput
        name={field.name}
        value={field.value}
        min={min}
        max={max}
        onChange={field.onChange}
        onBlur={field.onBlur}
        error={fieldState.invalid}
        style={{ width: '200px' }}
      />
      <ErrorText>{fieldState.error?.message}</ErrorText>
    </>
  );
}

export function ReactHookFormSubmitButton({ label }: { label: React.ReactNode }) {
  const { formState } = useFormContext();
  return (
    <Button type="submit" disabled={formState.isSubmitting} className="bg-green-600 text-white hover:bg-green-600/80">
      {label}
    </Button>
  );
}
