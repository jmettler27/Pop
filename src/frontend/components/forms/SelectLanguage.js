import { MySelect } from '@/frontend/components/forms/StyledFormComponents';

import { LOCALES, prependLocaleWithEmoji } from '@/frontend/utils/locales';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.SelectLanguage', {
  label: 'Language of the question',
  header: 'Select the language',
});

export default function SelectLanguage({ validationSchema, name = 'lang' }) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <option value="">{intl.formatMessage(messages.header)}</option>
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {prependLocaleWithEmoji(locale)}
        </option>
      ))}
    </MySelect>
  );
}
