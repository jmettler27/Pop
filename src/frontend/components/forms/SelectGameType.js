import { GameType, prependGameTypeWithEmoji } from '@/backend/models/games/GameType';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';
import { MySelect } from '@/frontend/components/forms/StyledFormComponents';

export default function SelectGameType({ validationSchema, lang = DEFAULT_LOCALE, name = 'type' }) {
  return (
    <MySelect label={LABEL[lang]} name={name} validationSchema={validationSchema}>
      <option value="">{HEADER[lang]}</option>
      {/*{GameType.map((gameType) => <option key={gameType} value={gameType}>{prependGameTypeWithEmoji(gameType)}</option>)}*/}
    </MySelect>
  );
}

const LABEL = {
  en: 'Type of the game',
  'fr-FR': 'Type de la partie',
};

const HEADER = {
  en: 'Select the type of game',
  'fr-FR': 'Sélectionnez le type de la partie',
};
