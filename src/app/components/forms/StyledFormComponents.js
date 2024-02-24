import React from "react";
import { Field, useField, useFormikContext } from 'formik';

import styled from "@emotion/styled";
import "@/app/submit/styles.css";
import "@/app/submit/styles-custom.css";

import { numCharsIndicator, requiredObjectInArrayFieldIndicator, requiredFieldIndicator, requiredStringInArrayFieldIndicator, numEmojisIndicator } from "@/lib/utils/forms";

const requiredIndicator = (validationSchema, fieldType, fieldName) => {
    switch (fieldType) {
        case 'string':
            return requiredFieldIndicator(validationSchema, fieldName)
        case 'string_in_array': {
            const outerFieldName = fieldName.split('.')[0]
            return requiredStringInArrayFieldIndicator(validationSchema, outerFieldName)
        }
        case 'object_in_array': {
            const [outerFieldName, _, innerFieldName] = fieldName.split('.')
            return requiredObjectInArrayFieldIndicator(validationSchema, outerFieldName, innerFieldName)
        }
    }
}

export const MyTextInput = ({ label, maxLength, validationSchema, fieldType = 'string', ...props }) => {
    // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
    // which we can spread on <input> and alse replace ErrorMessage entirely.
    const [field, meta] = useField(props);

    // const maxLength = validationSchema.fields[field.name].tests.find(test => test.OPTIONS.name === 'max')?.OPTIONS.params.max || 0
    return (
        <>
            <label htmlFor={props.id || props.name}>{requiredIndicator(validationSchema, fieldType, field.name)}{label} {maxLength > 0 && (props.onlyEmojis ? numEmojisIndicator(field.value, maxLength) : numCharsIndicator(field.value, maxLength))}</label>
            <input className='text-input' {...field} {...props} value={field.value || ''} />
            {meta.touched && meta.error && <div className='error'>{meta.error}</div>}
        </>
    );
};


export const MyCheckbox = ({ children, ...props }) => {
    const [field, meta] = useField({ ...props, type: 'checkbox' });
    return (
        <>
            <label className='checkbox'>
                <input {...field} {...props} type='checkbox' value={field.value || ''} />
                {children}
            </label>
            {meta.touched && meta.error && <div className='error'>{meta.error}</div>}
        </>
    );
};

// Styled components ....
const StyledSelect = styled.select`
  color: var(--blue);
`;

export const StyledErrorMessage = styled.div`
  font-size: 12px;
  color: var(--red-600);
  width: 400px;
  margin-top: 0.25rem;
  &:before {
    content: "❌ ";
    font-size: 10px;
  }
  @media (prefers-color-scheme: dark) {
    color: var(--red-300);
  }
`;

const StyledLabel = styled.label`
  margin-top: 1rem;
`;

export const MySelect = ({ label, validationSchema, ...props }) => {
    // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
    // which we can spread on <input> and alse replace ErrorMessage entirely.
    const [field, meta] = useField(props);

    return (
        <>
            <StyledLabel htmlFor={props.id || props.name} >{requiredFieldIndicator(validationSchema, field.name)}{label}</StyledLabel>
            <StyledSelect className='dark:text-white' {...field} {...props} />
            {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
        </>
    );
};


import { NumberInput } from "./NumberInput";
export function MyNumberInput({ label, name, min, max, ...props }) {
    const formik = useFormikContext();
    const [field, meta, helpers] = useField(name);

    return (
        <>
            <StyledLabel htmlFor={props.id || props.name}>{requiredIndicator(true)}{label} ({min}-{max})</StyledLabel>
            <NumberInput name={field.name} value={field.value} min={min} max={max}
                onChange={(event, newValue) => {
                    helpers.setValue(newValue);
                    event.preventDefault()
                }}
                onBlur={formik.handleBlur}
                error={meta.touched && meta.error}
                style={{ width: '200px' }}
            />
            {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
        </>
    )

}

export function MyRadioGroup({ label, name, trueText, falseText, validationSchema, ...props }) {
    const [field, meta, helpers] = useField(name);

    return (
        <>
            <span>{label} {field.value !== null && <strong>{field.value ? trueText : falseText}</strong>}</span>
            <div role='group' aria-labelledby='radio-group' className='flex flex-row space-x-2'>
                <label>
                    <Field type='radio' name='picked' value={trueText}
                        onClick={() => helpers.setValue(true)}
                    />
                    {trueText}
                </label>
                <label>
                    <Field type='radio' name='picked' value={falseText}
                        onClick={() => helpers.setValue(false)}
                    />
                    {falseText}
                </label>
            </div>
            {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
        </>
    );
}

import Chrome from '@uiw/react-color-chrome';

export function MyColorPicker({ label, validationSchema, name, ...props }) {
    const [field, meta, helpers] = useField(name);

    console.log("Field:", field)
    console.log("Meta:", meta)

    return (
        <div className='space-y-1'>
            <StyledLabel htmlFor={props.id || props.name}>{requiredFieldIndicator(validationSchema, field.name)}{label}</StyledLabel>
            <Chrome
                color={field.value}
                // style={{ float: 'left' }}
                // placement={GithubPlacement.Right}
                onChange={(color) => helpers.setValue(color.hex)}
            />
            {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
        </div>
    )
}

