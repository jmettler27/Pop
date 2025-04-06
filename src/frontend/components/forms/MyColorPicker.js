import React from 'react';

import Sketch from '@uiw/react-color-sketch';

import { useField } from 'formik';

import { requiredIndicator } from "@/frontend/utils/forms/forms";

import { StyledLabel, StyledErrorMessage } from "@/frontend/components/forms/StyledFormComponents";

export default function MyColorPicker({ label, validationSchema, name, ...props }) {
    const [field, meta, helpers] = useField(name);

    return (
        <div className='space-y-1'>
            <StyledLabel htmlFor={props.id || props.name}>{requiredIndicator(validationSchema, 'string', field.name)}{label}</StyledLabel>
            <Sketch
                color={field.value}
                // style={{ marginTop: 10, width: 140 }}
                // showEyeDropper={false}
                // showColorPreview={false}
                // showEditableInput={false}
                onChange={(color) => {
                    helpers.setValue(color.hex)
                }}
            />
            {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
        </div>
    )
}
