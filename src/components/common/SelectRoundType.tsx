import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { MySelect } from '@/components/common/StyledFormComponents';
import { SelectItem } from '@/components/ui/select';
import type { Locale } from '@/helpers/locales';
import defineMessages from '@/i18n/defineMessages';
import { prependRoundTypeWithEmoji, RoundType } from '@/models/rounds/round-type';

const messages = defineMessages('frontend.forms.SelectRoundType', {
  label: 'Type of the round',
  header: 'Select the type of round',
});

interface SelectRoundTypeProps {
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  name?: string;
}

export default function SelectRoundType({ validationSchema, name = 'type' }: SelectRoundTypeProps) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <SelectItem value="">{intl.formatMessage(messages.header)}</SelectItem>
      {Object.values(RoundType).map((roundType) => (
        <SelectItem key={roundType} value={roundType}>
          {prependRoundTypeWithEmoji(roundType, intl.locale as Locale)}
        </SelectItem>
      ))}
    </MySelect>
  );
}
