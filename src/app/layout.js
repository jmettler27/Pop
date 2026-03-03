import { Inter } from 'next/font/google';
import '@/app/globals.css';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SessionProvider from '@/app/SessionProvider';
import LocaleProvider from '@/app/LocaleProvider';

const inter = Inter({ subsets: ['latin'] }); //, display: 'swap' })

export const metadata = {
  title: 'Pop!',
  description: 'Pop! is a multiplayer quiz game revolving around pop culture.',
};

// https://github.com/mui/material-ui/issues/34898#issuecomment-1568462651
import ThemeWrapper from '@/app/ThemeWrapper';

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    // lang is managed client-side by LocaleProvider (updates document.documentElement.lang)
    <html lang="fr">
      <ThemeWrapper>
        <body className={`${inter.className} bg-slate-800 text-slate-100`}>
          <SessionProvider session={session}>
            <LocaleProvider>{children}</LocaleProvider>
          </SessionProvider>
        </body>
      </ThemeWrapper>
    </html>
  );
}
