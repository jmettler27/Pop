import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

export default function GameEndBottomPane({ lang = DEFAULT_LOCALE }) {
  return (
    <div className="flex flex-col h-full justify-around items-center">
      <span className="2xl:text-4xl font-bold">{CONGRATULATIONS[lang]} 👏</span>
    </div>
  );
}

const CONGRATULATIONS = {
  en: 'Congratulations to all!',
  'fr-FR': 'Bravo à tous !',
};
