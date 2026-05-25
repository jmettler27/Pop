'use client';

import Link from 'next/link';

import HomeIcon from '@mui/icons-material/Home';
import LanguageIcon from '@mui/icons-material/Language';
import { useIntl } from 'react-intl';

import { useLocale } from '@/app/LocaleProvider';
import { LOCALE_TO_TITLE, LOCALES } from '@/frontend/helpers/locales';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';

const messages = defineMessages('frontend.components.AppFooter', {
  selectLanguage: 'Select language',
  returnHome: 'Return home',
});

export default function AppFooter() {
  const { locale, setLocale } = useLocale();
  const intl = useIntl();

  return (
    <footer className="w-full border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors duration-200"
        >
          <HomeIcon sx={{ fontSize: '1.1rem' }} />
          <span className="hidden sm:inline">{intl.formatMessage(messages.returnHome)}</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <LanguageIcon sx={{ fontSize: '1.1rem' }} className="text-gray-400" />
            <span className="text-gray-400 text-xs hidden sm:inline">
              {intl.formatMessage(globalMessages.language)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                title={LOCALE_TO_TITLE[loc]}
                aria-label={LOCALE_TO_TITLE[loc]}
                className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer',
                  locale === loc
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-gray-800 hover:bg-gray-200 hover:text-gray-900',
                ].join(' ')}
              >
                <span className="hidden sm:inline">{LOCALE_TO_TITLE[loc]}</span>
                <span className="sm:hidden uppercase">{loc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
