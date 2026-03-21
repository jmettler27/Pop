'use client';

import Link from 'next/link';

import ConstructionIcon from '@mui/icons-material/Construction';
import HomeIcon from '@mui/icons-material/Home';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import globalMessages from '@/i18n/globalMessages';

export default function GameUnderConstructionScreen() {
  const intl = useIntl();

  return (
    <div className="flex flex-col min-h-screen w-full justify-center items-center gap-8 bg-slate-900">
      <ConstructionIcon sx={{ fontSize: 64, color: 'rgb(251 191 36)' }} />

      <h1 className="text-3xl md:text-4xl font-bold text-white text-center px-8">
        {intl.formatMessage(globalMessages.gameUnderConstructionTitle)}
      </h1>

      <p className="text-lg md:text-xl text-slate-300 text-center px-8 max-w-2xl leading-relaxed">
        {intl.formatMessage(globalMessages.gameUnderConstructionDescription)}
      </p>

      <Button
        component={Link}
        href="/"
        variant="contained"
        startIcon={<HomeIcon />}
        className="mt-2"
        sx={{
          backgroundColor: 'rgb(251 191 36)',
          color: 'rgb(15 23 42)',
          '&:hover': { backgroundColor: 'rgb(245 158 11)' },
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '0.5rem',
          px: 3,
          py: 1,
        }}
      >
        {intl.formatMessage(globalMessages.home)}
      </Button>
    </div>
  );
}
