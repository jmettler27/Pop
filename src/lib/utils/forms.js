import * as Yup from 'yup'

export const stringSchema = (maxLength, required = true) => required ?
    Yup.string().max(maxLength, `Must be ${maxLength} characters or less`).required("Required.") :
    Yup.string().max(maxLength, `Must be ${maxLength} characters or less`)

/* Indicator on the number of characters being written in a string field */
export const numCharsIndicator = (strField, maxLength) =>
    '(' + strField.length + '/' + maxLength + ')'

import { emojiCount } from './question/emoji'
/* Indicator on the number of emojis being written in a string field composed only of emojis */
export const numEmojisIndicator = (strField, maxLength) =>
    '(' + emojiCount(strField) + '/' + maxLength + ')'

import { DEFAULT_LOCALE } from './locales'

/* Required field indicator */
export const requiredIndicatorString = (isRequired) =>
    isRequired ? '' : `(${OPTIONAL[DEFAULT_LOCALE]}) `

const OPTIONAL = {
    'en': "Optional",
    'fr-FR': "Optionnel"
}

// Regular field
function fieldIsRequired(yupSchema, fieldName) {
    const field = yupSchema.fields[fieldName]
    return (
        field &&
        field.exclusiveTests &&
        Object.prototype.hasOwnProperty.call(field.exclusiveTests, 'required')
    );
}

export const requiredFieldIndicator = (yupSchema, fieldName) =>
    requiredIndicatorString(fieldIsRequired(yupSchema, fieldName))


// The field is a string field in an array field
function stringFieldinArrayFieldIsRequired(yupSchema, outerFieldName) {
    const outerField = yupSchema.fields[outerFieldName]
    return (
        outerField &&
        outerField.innerType &&
        outerField.innerType.exclusiveTests &&
        Object.prototype.hasOwnProperty.call(outerField.innerType.exclusiveTests, 'required')
    );
}

export const requiredStringInArrayFieldIndicator = (yupSchema, outerFieldName) =>
    requiredIndicatorString(stringFieldinArrayFieldIsRequired(yupSchema, outerFieldName))


// The field is an object field in an array field
function objectFieldInArrayFieldIsRequired(yupSchema, outerFieldName, innerFieldName) {
    const outerField = yupSchema.fields[outerFieldName]
    const innerField = outerField?.innerType?.fields[innerFieldName]
    return (
        innerField &&
        innerField.exclusiveTests &&
        Object.prototype.hasOwnProperty.call(innerField.exclusiveTests, 'required')
    );
}

export const requiredObjectInArrayFieldIndicator = (yupSchema, outerFieldName, innerFieldName) =>
    requiredIndicatorString(objectFieldInArrayFieldIsRequired(yupSchema, outerFieldName, innerFieldName))



import { REQUIRED_FILE_TEST_NAME } from './files'

// The field is a file (audio, image)
function fileFieldIsRequired(yupSchema, fieldName) {
    const field = yupSchema.fields[fieldName]
    return (
        field &&
        field.exclusiveTests &&
        Object.prototype.hasOwnProperty.call(field.exclusiveTests, REQUIRED_FILE_TEST_NAME)
    );
}

export const requiredFileFieldIndicator = (yupSchema, fieldName) =>
    requiredIndicatorString(fileFieldIsRequired(yupSchema, fieldName))


// The field is a boolean
function booleanFieldIsRequired(yupSchema, fieldName) {
    // const field = yupSchema.fields[fieldName]
    // return (
    //     field &&
    //     field.exclusiveTests &&
    //     Object.prototype.hasOwnProperty.call(field.exclusiveTests, 'required')
    // );
    return true
}
export const requiredBooleanFieldIndicator = (yupSchema, fieldName) =>
    requiredIndicatorString(booleanFieldIsRequired(yupSchema, fieldName))


export const requiredIndicator = (validationSchema, fieldType, fieldName) => {
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
