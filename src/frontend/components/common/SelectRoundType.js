import { useIntl } from 'react-intl';

import { MySelect } from '@/frontend/components/common/StyledFormComponents';
import defineMessages from '@/frontend/i18n/defineMessages';
import { prependRoundTypeWithEmoji, RoundType } from '@/models/rounds/RoundType';

const messages = defineMessages('frontend.forms.SelectRoundType', {
  label: 'Type of the round',
  header: 'Select the type of round',
});

export default function SelectRoundType({ validationSchema, name = 'type' }) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <option value="">{intl.formatMessage(messages.header)}</option>
      {Object.values(RoundType).map((roundType) => (
        <option key={roundType} value={roundType}>
          {prependRoundTypeWithEmoji(roundType, intl.locale)}
        </option>
      ))}
    </MySelect>
  );
}
