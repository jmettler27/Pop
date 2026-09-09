import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { MySelect } from '@/components/common/StyledFormComponents';
import { SelectItem } from '@/components/ui/select';
import { LOCALES, localeToTitle } from '@/helpers/locales';
import defineMessages from '@/i18n/defineMessages';

const messages = defineMessages('frontend.forms.SelectLanguage', {
  label: 'Language of the question',
  header: 'Select the language',
});

interface SelectLanguageProps {
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  name?: string;
}

export default function SelectLanguage({ validationSchema, name = 'lang' }: SelectLanguageProps) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <SelectItem value="">{intl.formatMessage(messages.header)}</SelectItem>
      {LOCALES.map((locale) => (
        <SelectItem key={locale} value={locale}>
          {localeToTitle(locale)}
        </SelectItem>
      ))}
    </MySelect>
  );
}
