'use client';

import type { ReactNode } from 'react';

import { createTheme, CssBaseline, StyledEngineProvider, ThemeProvider } from '@mui/material';

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const theme = createTheme({});
  return (
    <StyledEngineProvider injectFirst>
      <CssBaseline />
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
}
