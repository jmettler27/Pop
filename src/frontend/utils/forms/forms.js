import * as Yup from 'yup';
import defineMessages from '@/utils/defineMessages';

export const messages = defineMessages('frontend.utils.forms', {
  optional: 'Optional',
});

export const stringSchema = (maxLength, required = true) =>
  required
    ? Yup.string().max(maxLength, `Must be ${maxLength} characters or less`).required('Required.')
    : Yup.string().max(maxLength, `Must be ${maxLength} characters or less`);

/* Indicator on the number of characters being written in a string field */
export const numCharsIndicator = (strField, maxLength) => '(' + strField.length + '/' + maxLength + ')';

/* Required field indicator */
export const requiredIndicatorString = (isRequired, intl) =>
  isRequired ? '' : `(${intl.formatMessage(messages.optional)}) `;

// Regular field
function fieldIsRequired(yupSchema, fieldName) {
  const field = yupSchema.fields[fieldName];
  return field && field.exclusiveTests && Object.prototype.hasOwnProperty.call(field.exclusiveTests, 'required');
}

export const requiredFieldIndicator = (yupSchema, fieldName, intl) =>
  requiredIndicatorString(fieldIsRequired(yupSchema, fieldName), intl);

// The field is a string field in an array field
function stringFieldinArrayFieldIsRequired(yupSchema, outerFieldName) {
  const outerField = yupSchema.fields[outerFieldName];
  return (
    outerField &&
    outerField.innerType &&
    outerField.innerType.exclusiveTests &&
    Object.prototype.hasOwnProperty.call(outerField.innerType.exclusiveTests, 'required')
  );
}

export const requiredStringInArrayFieldIndicator = (yupSchema, outerFieldName, intl) =>
  requiredIndicatorString(stringFieldinArrayFieldIsRequired(yupSchema, outerFieldName), intl);

// The field is an object field in an array field
function objectFieldInArrayFieldIsRequired(yupSchema, outerFieldName, innerFieldName) {
  const outerField = yupSchema.fields[outerFieldName];
  const innerField = outerField?.innerType?.fields[innerFieldName];
  return (
    innerField &&
    innerField.exclusiveTests &&
    Object.prototype.hasOwnProperty.call(innerField.exclusiveTests, 'required')
  );
}

export const requiredObjectInArrayFieldIndicator = (yupSchema, outerFieldName, innerFieldName, intl) =>
  requiredIndicatorString(objectFieldInArrayFieldIsRequired(yupSchema, outerFieldName, innerFieldName), intl);

import { REQUIRED_FILE_TEST_NAME } from '@/frontend/utils/forms/files';

// The field is a file (audio, image)
function fileFieldIsRequired(yupSchema, fieldName) {
  const field = yupSchema.fields[fieldName];
  return (
    field && field.exclusiveTests && Object.prototype.hasOwnProperty.call(field.exclusiveTests, REQUIRED_FILE_TEST_NAME)
  );
}

export const requiredFileFieldIndicator = (yupSchema, fieldName, intl) =>
  requiredIndicatorString(fileFieldIsRequired(yupSchema, fieldName), intl);

// The field is a boolean
function booleanFieldIsRequired(yupSchema, fieldName) {
  // const field = yupSchema.fields[fieldName]
  // return (
  //     field &&
  //     field.exclusiveTests &&
  //     Object.prototype.hasOwnProperty.call(field.exclusiveTests, 'required')
  // );
  return true;
}
export const requiredBooleanFieldIndicator = (yupSchema, fieldName, intl) =>
  requiredIndicatorString(booleanFieldIsRequired(yupSchema, fieldName), intl);

export const requiredIndicator = (validationSchema, fieldType, fieldName, intl) => {
  switch (fieldType) {
    case 'string':
      return requiredFieldIndicator(validationSchema, fieldName, intl);
    case 'string_in_array': {
      const outerFieldName = fieldName.split('.')[0];
      return requiredStringInArrayFieldIndicator(validationSchema, outerFieldName, intl);
    }
    case 'object_in_array': {
      const [outerFieldName, _, innerFieldName] = fieldName.split('.');
      return requiredObjectInArrayFieldIndicator(validationSchema, outerFieldName, innerFieldName, intl);
    }
  }
};
