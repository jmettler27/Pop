import { MySelect } from '@/frontend/components/forms/StyledFormComponents';

import { allTopicsToTitle } from '@/backend/models/Topic';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.SelectQuestionTopic', {
  label: 'Topic of the question',
  header: 'Select the topic',
});

export default function SelectQuestionTopic({ validationSchema, name = 'topic' }) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <option value="">{intl.formatMessage(messages.header)}</option>
      {allTopicsToTitle(intl.locale).map(([topic, title]) => (
        <option key={topic} value={topic}>
          {title}
        </option>
      ))}
    </MySelect>
  );
}
