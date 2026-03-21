'use client';

import { createTheme, CssBaseline, StyledEngineProvider, ThemeProvider } from '@mui/material';

export default function ThemeWrapper({ children }) {
  const theme = createTheme({});
  return (
    <StyledEngineProvider injectFirst>
      <CssBaseline />
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
}
