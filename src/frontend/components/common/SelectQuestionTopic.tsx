import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { MySelect } from '@/frontend/components/common/StyledFormComponents';
import { SelectItem } from '@/frontend/components/ui/select';
import type { Locale } from '@/frontend/helpers/locales';
import defineMessages from '@/frontend/i18n/defineMessages';
import { allTopicsToTitle } from '@/models/topic';

const messages = defineMessages('frontend.forms.SelectQuestionTopic', {
  label: 'Topic of the question',
  header: 'Select the topic',
});

interface SelectQuestionTopicProps {
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  name?: string;
}

export default function SelectQuestionTopic({ validationSchema, name = 'topic' }: SelectQuestionTopicProps) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <SelectItem value="">{intl.formatMessage(messages.header)}</SelectItem>
      {allTopicsToTitle(intl.locale as Locale).map(([topic, title]) => (
        <SelectItem key={topic} value={topic}>
          {title}
        </SelectItem>
      ))}
    </MySelect>
  );
}
