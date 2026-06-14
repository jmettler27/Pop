'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button, Divider, TextField } from '@mui/material';
import { signIn } from 'next-auth/react';
import { useIntl } from 'react-intl';

import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('app.auth.signin', {
  subtitle: 'Sign in to continue',
  signInWithGoogle: 'Sign in with Google',
  signInWithDiscord: 'Sign in with Discord',
  devAccountLabel: 'Dev account name',
  devAccountPlaceholder: 'alice',
  devSignIn: 'Sign in',
  orPlayAsGuest: 'Or play as guest',
  guestNameLabel: 'Your nickname',
  guestNamePlaceholder: 'My nickname',
  playAsGuest: 'Play as guest',
});

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const darkFieldSx = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#475569' },
    '&:hover fieldset': { borderColor: '#64748b' },
    '&.Mui-focused fieldset': { borderColor: '#818cf8' },
  },
};

export default function SignInPage() {
  const intl = useIntl();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  // Guest option is only available when the user was redirected from a join URL
  // (i.e. they scanned a QR code). This prevents random visitors from creating
  // guest accounts without a valid game invite.
  const showGuestOption = callbackUrl.startsWith('/join/');

  const [devName, setDevName] = useState('');
  const [guestName, setGuestName] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex flex-col gap-4 w-full max-w-sm rounded-2xl bg-gray-800/70 backdrop-blur p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">Pop!</span>
          <span className="text-sm text-slate-400 mt-1">{intl.formatMessage(messages.subtitle)}</span>
        </div>

        {useEmulators ? (
          <>
            <TextField
              placeholder={intl.formatMessage(messages.devAccountPlaceholder)}
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              variant="outlined"
              size="small"
              inputProps={{ style: { color: '#f1f5f9' } }}
              sx={darkFieldSx}
            />
            <Button
              variant="contained"
              onClick={() => signIn('credentials', { name: devName || 'alice', callbackUrl })}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {intl.formatMessage(messages.devSignIn)}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={() => signIn('google', { callbackUrl })}
              sx={{
                backgroundColor: '#fff',
                color: '#3c4043',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                '&:hover': { backgroundColor: '#f1f3f4' },
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {intl.formatMessage(messages.signInWithGoogle)}
            </Button>
            <Button
              variant="contained"
              startIcon={<DiscordIcon />}
              onClick={() => signIn('discord', { callbackUrl })}
              sx={{
                backgroundColor: '#5865F2',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                '&:hover': { backgroundColor: '#4752C4' },
              }}
            >
              {intl.formatMessage(messages.signInWithDiscord)}
            </Button>
          </>
        )}

        {showGuestOption && (
          <>
            <Divider sx={{ borderColor: '#475569', color: '#94a3b8', fontSize: '0.75rem', my: 1 }}>
              {intl.formatMessage(messages.orPlayAsGuest)}
            </Divider>
            <TextField
              placeholder={intl.formatMessage(messages.guestNamePlaceholder)}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              variant="outlined"
              size="small"
              inputProps={{ style: { color: '#f1f5f9' } }}
              sx={darkFieldSx}
            />
            <Button
              variant="outlined"
              disabled={!guestName.trim()}
              onClick={() => signIn('guest', { name: guestName.trim(), callbackUrl })}
              sx={{
                borderColor: '#475569',
                color: '#f1f5f9',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#64748b', backgroundColor: 'rgba(255,255,255,0.05)' },
                '&.Mui-disabled': { borderColor: '#334155', color: '#475569' },
              }}
            >
              {intl.formatMessage(messages.playAsGuest)}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
