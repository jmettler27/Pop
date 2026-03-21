'use client';

import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import globalMessages from '@/i18n/globalMessages';
import { getRandomElement } from '@/backend/utils/arrays';

const LOADING_TIP_KEYS = [
  'loadingTip1',
  'loadingTip2',
  'loadingTip3',
  'loadingTip4',
  'loadingTip5',
  'loadingTip6',
  'loadingTip7',
  'loadingTip8',
  'loadingTip9',
  'loadingTip10',
  'loadingTip11',
  'loadingTip12',
  'loadingTip13',
  'loadingTip14',
  'loadingTip15',
  'loadingTip16',
  'loadingTip17',
];

export default function LoadingScreen({ inline = false }) {
  const intl = useIntl();

  const tip = useMemo(() => {
    const key = getRandomElement(LOADING_TIP_KEYS);
    return intl.formatMessage(globalMessages[key]);
  }, [intl]);

  return (
    <div className={`flex flex-col w-full justify-center items-center gap-10 ${inline ? 'h-full' : 'min-h-screen'}`}>
      <p className="text-lg md:text-xl text-slate-200 tracking-wide text-center px-8 italic font-light max-w-2xl leading-relaxed drop-shadow-[0_0_12px_rgba(34,211,238,0.25)]">
        {tip}
      </p>

      <div className="flex items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="block h-2.5 w-2.5 rounded-full"
            style={{
              animation: 'loading-wave 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes loading-wave {
          0%,
          100% {
            transform: translateY(0) scale(0.8);
            background-color: rgb(100 116 139);
            box-shadow: none;
          }
          50% {
            transform: translateY(-12px) scale(1.1);
            background-color: rgb(34 211 238);
            box-shadow: 0 0 14px 4px rgba(34, 211, 238, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
