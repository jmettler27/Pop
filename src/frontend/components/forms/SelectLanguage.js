import { MySelect } from '@/frontend/components/forms/StyledFormComponents';

import { DEFAULT_LOCALE, LOCALES, prependLocaleWithEmoji } from '@/frontend/utils/locales';

export default function SelectLanguage({
  validationSchema,
  labels = SELECT_QUESTION_LANGUAGE_LABEL,
  lang = DEFAULT_LOCALE,
  name = 'lang',
}) {
  return (
    <MySelect label={labels[lang]} name={name} validationSchema={validationSchema}>
      <option value="">{SELECT_QUESTION_LANGUAGE_HEADER[lang]}</option>
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {prependLocaleWithEmoji(locale)}
        </option>
      ))}
    </MySelect>
  );
}

const SELECT_QUESTION_LANGUAGE_LABEL = {
  en: 'Language of the question',
  'fr-FR': 'Langue de la question',
};

const SELECT_QUESTION_LANGUAGE_HEADER = {
  en: 'Select the language',
  'fr-FR': 'Sélectionnez la langue',
};
