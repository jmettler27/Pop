'use client';

import NextLink from 'next/link';

import { Construction, Home } from 'lucide-react';
import { useIntl } from 'react-intl';

import { Button } from '@/frontend/components/ui/button';
import globalMessages from '@/frontend/i18n/globalMessages';

export default function GameUnderConstructionScreen() {
  const intl = useIntl();

  return (
    <div className="flex flex-col min-h-screen w-full justify-center items-center gap-8 bg-slate-900">
      <Construction className="size-16 text-amber-400" />

      <h1 className="text-3xl md:text-4xl font-bold text-white text-center px-8">
        {intl.formatMessage(globalMessages.gameUnderConstructionTitle)}
      </h1>

      <p className="text-lg md:text-xl text-slate-300 text-center px-8 max-w-2xl leading-relaxed">
        {intl.formatMessage(globalMessages.gameUnderConstructionDescription)}
      </p>

      <Button
        nativeButton={false}
        render={<NextLink href="/" />}
        className="mt-2 bg-amber-400 text-slate-900 hover:bg-amber-500 normal-case font-semibold rounded-lg px-6 py-2"
      >
        <Home className="mr-2 size-4" />
        {intl.formatMessage(globalMessages.home)}
      </Button>
    </div>
  );
}
