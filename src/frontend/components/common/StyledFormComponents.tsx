import React from 'react';

import { Field, useField, useFormikContext } from 'formik';
import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { NumberInput } from '@/frontend/components/common/NumberInput';
import { Checkbox } from '@/frontend/components/ui/checkbox';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { numEmojisIndicator } from '@/frontend/helpers/forms/emojis';
import {
  numCharsIndicator,
  requiredFieldIndicator,
  requiredIndicator,
  requiredIndicatorString,
  type YupObjectSchema,
} from '@/frontend/helpers/forms/forms';
import { cn } from '@/frontend/lib/utils';

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
  type: _type,
  ...props
}: MyTextInputProps) {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  // which we can spread on <input> and alse replace ErrorMessage entirely.
  const [field, meta] = useField(props as { name: string });
  const intl = useIntl();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [field.value]);

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
      <textarea
        ref={textareaRef}
        className="min-h-8 w-full min-w-0 resize-none overflow-hidden rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 sm:text-sm md:text-base"
        {...field}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        value={(field.value as string) || ''}
        rows={1}
        onInput={(event) => {
          event.currentTarget.style.height = 'auto';
          event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
        }}
      />
      {meta.touched && meta.error && <FieldErrorText className="text-xs sm:text-sm">{meta.error}</FieldErrorText>}
    </>
  );
}

export function FieldError({ name }: { name: string }) {
  const [, meta] = useField(name);
  return meta.touched && meta.error ? <StyledErrorMessage>{meta.error}</StyledErrorMessage> : null;
}

interface MyCheckboxProps {
  children?: React.ReactNode;
  name: string;
  id?: string;
  [key: string]: unknown;
}

export function MyCheckbox({ children, ...props }: MyCheckboxProps) {
  const [field, meta, helpers] = useField({ ...props, type: 'checkbox' } as { name: string; type: 'checkbox' });
  return (
    <>
      <label className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
        <Checkbox
          {...(props as Record<string, unknown>)}
          name={field.name}
          checked={field.checked}
          onBlur={field.onBlur}
          onCheckedChange={(checked) => helpers.setValue(checked)}
        />
        {children}
      </label>
      {meta.touched && meta.error && <FieldErrorText className="text-xs sm:text-sm">{meta.error}</FieldErrorText>}
    </>
  );
}

// Field-level error, shown inline right under a single input (small, no icon).
function FieldErrorText({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mt-1 text-[clamp(0.75rem,1vw,0.875rem)] text-destructive', className)}>{children}</div>;
}

// Schema-level error, shown standalone under a control (bigger, with a leading icon).
export function StyledErrorMessage({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        "mt-1 w-full max-w-[400px] text-[clamp(0.75rem,1vw,0.875rem)] text-destructive before:content-['❌_']",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StyledLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('mt-4 block text-[clamp(0.875rem,1.2vw,1rem)] font-medium', className)} {...props} />;
}

interface MySelectProps {
  label: string;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  children?: React.ReactNode;
  name: string;
  id?: string;
  // Overrides the default `formik.setFieldValue(name, value)` — used by callers
  // that need to derive other field values from the selection (e.g. parsing an
  // index, or looking up a related record).
  onChange?: (value: string) => void;
  [key: string]: unknown;
}

export function MySelect({ label, validationSchema, children, onChange, ...props }: MySelectProps) {
  const [field, meta] = useField(props as { name: string });
  const formik = useFormikContext();
  const intl = useIntl();
  const id = (props.id as string | undefined) || field.name;

  // Base UI's <Select.Value> shows the raw value unless told what label goes
  // with it — derive that mapping from the <SelectItem> children so callers
  // don't have to pass a separate items list.
  const items = React.Children.toArray(children)
    .filter(React.isValidElement<{ value: string; children?: React.ReactNode }>)
    .map((item) => ({ value: item.props.value, label: item.props.children }));

  return (
    <>
      <StyledLabel htmlFor={id}>
        {validationSchema ? requiredFieldIndicator(validationSchema as YupObjectSchema, field.name, intl) : ''}
        {label}
      </StyledLabel>
      {/* A native <select>'s dropdown popup is OS chrome that ignores our CSS
          (notably `color-scheme`, on Windows Chromium) — Base UI's Select
          renders its own popup as a styled div, so it can actually be themed. */}
      <Select
        items={items}
        name={field.name}
        value={(field.value as string) ?? ''}
        onValueChange={(value: string | null) => {
          const nextValue = value ?? '';
          if (onChange) {
            onChange(nextValue);
          } else {
            formik.setFieldValue(field.name, nextValue);
          }
        }}
      >
        <SelectTrigger
          id={id}
          onBlur={field.onBlur}
          className="w-full cursor-pointer text-xs sm:text-sm 2xl:text-base"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
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

// Custom radio look (native <input type="radio"> kept so Formik's uncontrolled
// <Field type="radio"> click semantics keep working unmodified).
export const radioInputClassName =
  'relative size-4 shrink-0 appearance-none rounded-full border border-input bg-transparent outline-none transition-colors checked:border-primary checked:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 after:absolute after:inset-[3px] after:rounded-full after:bg-primary-foreground after:opacity-0 checked:after:opacity-100';

interface MyRadioGroupProps {
  label: string;
  name: string;
  trueText: string;
  falseText: string;
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  [key: string]: unknown;
}

export function MyRadioGroup({ label, name, trueText, falseText }: MyRadioGroupProps) {
  const [field, meta, helpers] = useField(name);

  return (
    <>
      <span>
        {label} {(field.value as boolean | null) !== null && <strong>{field.value ? trueText : falseText}</strong>}
      </span>
      <div role="group" aria-labelledby="radio-group" className="flex flex-row space-x-4">
        <label className="flex items-center gap-2 font-medium">
          <Field
            type="radio"
            name="picked"
            value={trueText}
            onClick={() => helpers.setValue(true)}
            className={radioInputClassName}
          />
          {trueText}
        </label>
        <label className="flex items-center gap-2 font-medium">
          <Field
            type="radio"
            name="picked"
            value={falseText}
            onClick={() => helpers.setValue(false)}
            className={radioInputClassName}
          />
          {falseText}
        </label>
      </div>
      {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
    </>
  );
}
