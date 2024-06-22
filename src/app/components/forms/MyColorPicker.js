// import Chrome from '@uiw/react-color-chrome';

import { useField } from 'formik';

import { requiredIndicator } from "@/lib/utils/forms";
import { StyledLabel, StyledErrorMessage } from "./StyledFormComponents";

export default function MyColorPicker({ label, validationSchema, name, ...props }) {
    const [field, meta, helpers] = useField(name);

    return (
        <div className='space-y-1'>
            <StyledLabel htmlFor={props.id || props.name}>{requiredIndicator(validationSchema, 'string', field.name)}{label}</StyledLabel>
            {/* <Chrome
                color={field.value}
                // style={{ marginTop: 10, width: 140 }}
                // showEyeDropper={false}
                // showColorPreview={false}
                // showEditableInput={false}
                onChange={(color) => {
                    helpers.setValue(color.hex)
                }}
            /> */}
            {meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>}
        </div>
    )
}
