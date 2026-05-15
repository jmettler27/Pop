import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { MySelect } from '@/frontend/components/common/StyledFormComponents';
import type { Locale } from '@/frontend/helpers/locales';
import defineMessages from '@/frontend/i18n/defineMessages';
import { prependScorePolicyTypeWithEmoji, ScorePolicyType } from '@/models/score-policy';

const messages = defineMessages('frontend.forms.SelectRoundScorePolicy', {
  label: 'Round score policy',
  header: 'Select the round score policy',
});

interface SelectRoundScorePolicyProps {
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  name?: string;
}

export default function SelectRoundScorePolicy({
  validationSchema,
  name = 'roundScorePolicy',
}: SelectRoundScorePolicyProps) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <option value="">{intl.formatMessage(messages.header)}</option>
      {Object.values(ScorePolicyType).map((policy) => (
        <option key={policy} value={policy}>
          {prependScorePolicyTypeWithEmoji(policy, intl.locale as Locale)}
        </option>
      ))}
    </MySelect>
  );
}
