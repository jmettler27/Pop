import { type IntlShape } from 'react-intl';
import * as Yup from 'yup';

import { REQUIRED_FILE_TEST_NAME } from '@/frontend/helpers/forms/files';
import defineMessages from '@/frontend/i18n/defineMessages';

export const messages = defineMessages('frontend.utils.forms', {
  optional: 'Optional',
});

type YupField = {
  exclusiveTests?: Record<string, boolean>;
  innerType?: YupField & { fields?: Record<string, YupField> };
  fields?: Record<string, YupField>;
};
// Permissive schema type — Yup's internal ObjectSchema shape is not publicly typed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type YupObjectSchema = { fields: Record<string, any> };

export const stringSchema = (maxLength: number, required = true): Yup.StringSchema =>
  required
    ? Yup.string().max(maxLength, `Must be ${maxLength} characters or less`).required('Required.')
    : Yup.string().max(maxLength, `Must be ${maxLength} characters or less`);

export const numCharsIndicator = (strField: string, maxLength: number): string =>
  '(' + strField.length + '/' + maxLength + ')';

export const requiredIndicatorString = (isRequired: boolean, intl: IntlShape): string =>
  isRequired ? '' : `(${intl.formatMessage(messages.optional)}) `;

function fieldIsRequired(yupSchema: YupObjectSchema, fieldName: string): boolean {
  const field = yupSchema.fields[fieldName];
  return !!(field?.exclusiveTests && Object.prototype.hasOwnProperty.call(field.exclusiveTests, 'required'));
}

export const requiredFieldIndicator = (yupSchema: YupObjectSchema, fieldName: string, intl: IntlShape): string =>
  requiredIndicatorString(fieldIsRequired(yupSchema, fieldName), intl);

function stringFieldInArrayFieldIsRequired(yupSchema: YupObjectSchema, outerFieldName: string): boolean {
  const outerField = yupSchema.fields[outerFieldName];
  return !!(
    outerField?.innerType?.exclusiveTests &&
    Object.prototype.hasOwnProperty.call(outerField.innerType.exclusiveTests, 'required')
  );
}

export const requiredStringInArrayFieldIndicator = (
  yupSchema: YupObjectSchema,
  outerFieldName: string,
  intl: IntlShape
): string => requiredIndicatorString(stringFieldInArrayFieldIsRequired(yupSchema, outerFieldName), intl);

function objectFieldInArrayFieldIsRequired(
  yupSchema: YupObjectSchema,
  outerFieldName: string,
  innerFieldName: string
): boolean {
  const innerField = yupSchema.fields[outerFieldName]?.innerType?.fields?.[innerFieldName];
  return !!(innerField?.exclusiveTests && Object.prototype.hasOwnProperty.call(innerField.exclusiveTests, 'required'));
}

export const requiredObjectInArrayFieldIndicator = (
  yupSchema: YupObjectSchema,
  outerFieldName: string,
  innerFieldName: string,
  intl: IntlShape
): string =>
  requiredIndicatorString(objectFieldInArrayFieldIsRequired(yupSchema, outerFieldName, innerFieldName), intl);

function fileFieldIsRequired(yupSchema: YupObjectSchema, fieldName: string): boolean {
  const field = yupSchema.fields[fieldName];
  return !!(
    field?.exclusiveTests && Object.prototype.hasOwnProperty.call(field.exclusiveTests, REQUIRED_FILE_TEST_NAME)
  );
}

export const requiredFileFieldIndicator = (yupSchema: YupObjectSchema, fieldName: string, intl: IntlShape): string =>
  requiredIndicatorString(fileFieldIsRequired(yupSchema, fieldName), intl);

export const requiredBooleanFieldIndicator = (
  _yupSchema: YupObjectSchema,
  _fieldName: string,
  intl: IntlShape
): string => requiredIndicatorString(true, intl);

export const requiredIndicator = (
  validationSchema: YupObjectSchema,
  fieldType: string,
  fieldName: string,
  intl: IntlShape
): string | undefined => {
  switch (fieldType) {
    case 'string':
      return requiredFieldIndicator(validationSchema, fieldName, intl);
    case 'string_in_array': {
      const outerFieldName = fieldName.split('.')[0];
      return requiredStringInArrayFieldIndicator(validationSchema, outerFieldName, intl);
    }
    case 'object_in_array': {
      const [outerFieldName, , innerFieldName] = fieldName.split('.');
      return requiredObjectInArrayFieldIndicator(validationSchema, outerFieldName, innerFieldName, intl);
    }
  }
};
