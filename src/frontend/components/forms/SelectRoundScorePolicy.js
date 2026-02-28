import { MySelect } from '@/frontend/components/forms/StyledFormComponents';

import { prependScorePolicyTypeWithEmoji, ScorePolicyType } from '@/backend/models/ScorePolicy';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.SelectRoundScorePolicy', {
  label: 'Round score policy',
  header: 'Select the round score policy',
});

export default function SelectRoundScorePolicy({ validationSchema, name = 'roundScorePolicy' }) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <option value="">{intl.formatMessage(messages.header)}</option>
      {Object.values(ScorePolicyType).map((policy) => (
        <option key={policy} value={policy}>
          {prependScorePolicyTypeWithEmoji(policy)}
        </option>
      ))}
    </MySelect>
  );
}
