import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { MySelect } from '@/components/common/StyledFormComponents';
import { SelectItem } from '@/components/ui/select';
import defineMessages from '@/i18n/defineMessages';

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
      <SelectItem value="">{intl.formatMessage(messages.header)}</SelectItem>
      {/*{GameType.map((gameType) => <SelectItem key={gameType} value={gameType}>{prependGameTypeWithEmoji(gameType)}</SelectItem>)}*/}
    </MySelect>
  );
}
