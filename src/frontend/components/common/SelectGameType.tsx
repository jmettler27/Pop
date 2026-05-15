import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { MySelect } from '@/frontend/components/common/StyledFormComponents';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.forms.SelectGameType', {
  label: 'Type of the game',
  header: 'Select the type of game',
});

interface SelectGameTypeProps {
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  name?: string;
}

export default function SelectGameType({ validationSchema, name = 'type' }: SelectGameTypeProps) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <option value="">{intl.formatMessage(messages.header)}</option>
      {/*{GameType.map((gameType) => <option key={gameType} value={gameType}>{prependGameTypeWithEmoji(gameType)}</option>)}*/}
    </MySelect>
  );
}
