'use client';

import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import globalMessages from '@/i18n/globalMessages';

import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';
import { Button } from '@mui/material';
import { getRandomElement } from '@/backend/utils/arrays';

const ERROR_TIP_KEYS = [
  'errorTip1',
  'errorTip2',
  'errorTip3',
  'errorTip4',
  'errorTip5',
  'errorTip6',
  'errorTip7',
  'errorTip8',
  'errorTip9',
  'errorTip10',
  'errorTip11',
  'errorTip12',
  'errorTip13',
  'errorTip14',
  'errorTip15',
  'errorTip16',
  'errorTip17',
];

export default function ErrorScreen({ inline = false }) {
  const intl = useIntl();

  const tip = useMemo(() => {
    const key = getRandomElement(ERROR_TIP_KEYS);
    return intl.formatMessage(globalMessages[key]);
  }, [intl]);

  return (
    <div className={`flex flex-col w-full justify-center items-center gap-10 ${inline ? 'h-full' : 'min-h-screen'}`}>
      <p className="text-lg md:text-xl text-slate-200 tracking-wide text-center px-8 italic font-light max-w-2xl leading-relaxed drop-shadow-[0_0_12px_rgba(248,113,113,0.25)]">
        {tip}
      </p>

      <div className="flex items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="block h-2.5 w-2.5 rounded-full"
            style={{
              animation: 'error-pulse 2s ease-in-out infinite',
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {!inline && (
        <Button
          component={Link}
          href="/"
          variant="contained"
          startIcon={<HomeIcon />}
          className="mt-2"
          sx={{
            backgroundColor: 'rgb(239 68 68)',
            '&:hover': { backgroundColor: 'rgb(220 38 38)' },
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '0.5rem',
            px: 3,
            py: 1,
          }}
        >
          {intl.formatMessage(globalMessages.home)}
        </Button>
      )}

      <style jsx>{`
        @keyframes error-pulse {
          0%,
          100% {
            transform: scale(0.8);
            background-color: rgb(100 116 139);
            box-shadow: none;
          }
          50% {
            transform: scale(1.2);
            background-color: rgb(248 113 113);
            box-shadow: 0 0 14px 4px rgba(248, 113, 113, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
