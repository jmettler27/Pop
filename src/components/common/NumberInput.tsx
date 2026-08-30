import * as React from 'react';

import { NumberField } from '@base-ui/react/number-field';
import { Minus, Plus } from 'lucide-react';

interface NumberInputOwnProps {
  onChange?: (value: number | null) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  error?: boolean | string;
  style?: React.CSSProperties;
  name?: string;
  value?: number | null;
  min?: number;
  max?: number;
}

type NumberInputProps = NumberInputOwnProps & Record<string, unknown>;

export const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(function CustomNumberInput(props, ref) {
  const { onChange, onBlur, error: _error, style, ...rest } = props as NumberInputOwnProps & Record<string, unknown>;

  return (
    <NumberField.Root
      {...rest}
      onValueChange={(value) => {
        if (onChange) {
          onChange(value);
        }
      }}
      ref={ref}
    >
      <NumberField.Group render={<div className="flex flex-row items-center text-muted-foreground" style={style} />}>
        <NumberField.Decrement render={<button className={numberFieldButtonClassName} />}>
          <Minus className="size-4" />
        </NumberField.Decrement>
        <NumberField.Input render={<input className={numberFieldInputClassName} />} onBlur={onBlur} />
        <NumberField.Increment render={<button className={`${numberFieldButtonClassName} order-1`} />}>
          <Plus className="size-4" />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
});

const numberFieldInputClassName =
  'mx-2! w-16! min-w-0! rounded-lg! border! border-input! bg-input/30! px-3! py-2.5! text-center! text-sm! text-foreground! shadow-xs! outline-0! transition-colors hover:border-ring! focus:border-ring! focus:ring-3! focus:ring-ring/50! focus-visible:outline-0!';

const numberFieldButtonClassName =
  'flex size-[30px] flex-row items-center justify-center rounded-full! border! border-input! bg-input/30! text-foreground! transition-all duration-[120ms] ease-in-out hover:cursor-pointer hover:border-primary! hover:bg-primary! hover:text-primary-foreground! focus-visible:outline-0!';
