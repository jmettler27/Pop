import * as React from 'react';
import type { SyntheticEvent } from 'react';

import { NumberField } from '@base-ui/react/number-field';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { styled } from '@mui/system';

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
      <NumberField.Group render={<StyledInputRoot style={style} />}>
        <NumberField.Decrement render={<StyledButton />}>
          <RemoveIcon fontSize="small" />
        </NumberField.Decrement>
        <NumberField.Input render={<StyledInput />} onBlur={onBlur} />
        <NumberField.Increment render={<StyledButton className="increment" />}>
          <AddIcon fontSize="small" />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
});

const blue = {
  100: '#daecff',
  200: '#b6daff',
  300: '#66b2ff',
  400: '#3399ff',
  500: '#007fff',
  600: '#0072e5',
  700: '#0059B2',
  800: '#004c99',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const StyledInputRoot = styled('div')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 400;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[500]};
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`
);

const StyledInput = styled('input')(
  ({ theme }) => `
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 400;
  line-height: 1.375;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0px 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.5)' : 'rgba(0,0,0, 0.05)'};
  border-radius: 8px;
  margin: 0 8px;
  padding: 10px 12px;
  outline: 0;
  min-width: 0;
  width: 4rem;
  text-align: center;

  &:hover {
    border-color: ${blue[400]};
  }

  &:focus {
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[700] : blue[200]};
  }

  &:focus-visible {
    outline: 0;
  }
`
);

const StyledButton = styled('button')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  line-height: 1.5;
  border: 1px solid;
  border-radius: 999px;
  border-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
  width: 30px;
  height: 30px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    cursor: pointer;
    background: ${theme.palette.mode === 'dark' ? blue[700] : blue[500]};
    border-color: ${theme.palette.mode === 'dark' ? blue[500] : blue[400]};
    color: ${grey[50]};
  }

  &:focus-visible {
    outline: 0;
  }

  &.increment {
    order: 1;
  }
`
);
