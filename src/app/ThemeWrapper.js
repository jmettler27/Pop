'use client';

import { createTheme, CssBaseline, StyledEngineProvider, ThemeProvider } from '@mui/material';

export default function ThemeWrapper({ children }) {
  const theme = createTheme({ palette: { mode: 'dark' } });
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
