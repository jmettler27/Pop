import { GameType, prependGameTypeWithEmoji } from '@/backend/models/games/GameType';

import { MySelect } from '@/frontend/components/forms/StyledFormComponents';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.SelectGameType', {
  label: 'Type of the game',
  header: 'Select the type of game',
});

export default function SelectGameType({ validationSchema, name = 'type' }) {
  const intl = useIntl();
  return (
    <MySelect label={intl.formatMessage(messages.label)} name={name} validationSchema={validationSchema}>
      <option value="">{intl.formatMessage(messages.header)}</option>
      {/*{GameType.map((gameType) => <option key={gameType} value={gameType}>{prependGameTypeWithEmoji(gameType)}</option>)}*/}
    </MySelect>
  );
}
