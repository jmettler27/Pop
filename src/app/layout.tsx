import type { ReactNode } from 'react';
import { Geist, Inter } from 'next/font/google';

import '@/app/globals.css';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import FirebaseAuthProvider from '@/app/FirebaseAuthProvider';
import LocaleProvider from '@/app/LocaleProvider';
import QueryProvider from '@/app/QueryProvider';
import SessionProvider from '@/app/SessionProvider';
import { TooltipProvider } from '@/frontend/components/ui/tooltip';
import { cn } from '@/frontend/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ subsets: ['latin'] }); //, display: 'swap' })

export const metadata = {
  title: 'Pop!',
  description: 'Pop! is a multiplayer quiz game revolving around pop culture.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    // lang is managed client-side by LocaleProvider (updates document.documentElement.lang)
    // class="dark" is permanent — the app only supports dark mode (see @custom-variant dark in globals.css)
    <html lang="fr" className={cn('dark', 'font-sans', geist.variable)}>
      <body className={`${inter.className} bg-slate-800 text-slate-100`}>
        <QueryProvider>
          <SessionProvider session={session}>
            <FirebaseAuthProvider>
              <LocaleProvider>
                <TooltipProvider>{children}</TooltipProvider>
              </LocaleProvider>
            </FirebaseAuthProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
