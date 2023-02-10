import {
  PaletteMode,
  ThemeOptions,
  createTheme,
  responsiveFontSizes,
} from '@mui/material';

import darkThemeOverrides from './theme-dark-overrides';
import { deepmerge } from '@mui/utils';
import lightThemeOverrides from './theme-light-overrides';

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    dark: Palette['primary'];
  }
  interface PaletteOptions {
    dark?: PaletteOptions['primary'];
  }
}

export const customTheme = (mode: PaletteMode = 'dark'): ThemeOptions => {
  const themeOptions: Partial<ThemeOptions> = {
    palette: {
      background: {
        paper: '#121212',
        default: '#121212',
      },
      primary: {
        light: '#2a4453',
        main: '#001d2a',
        dark: '#000000',
      },
      secondary: {
        light: '#ffc349',
        main: '#F6920A',
        dark: '#bd6400',
      },
      info: {
        light: '#83cbff',
        main: '#50b5ff',
        dark: '#1d9fff',
      },
      success: {
        light: '#5ceb47',
        main: '#00b701',
        dark: '#008600',
      },
      warning: {
        light: '#ffcf70',
        main: '#ffb116',
        dark: '#fba700',
      },
      error: {
        light: '#f68692',
        main: '#f25767',
        dark: '#ee283c',
      },
      contrastThreshold: 4,
    },
    typography: {
      fontFamily: ['Raleway', 'Open Sans', 'sans-serif'].join(','),
      fontSize: 16,
      h1: {
        fontFamily: 'Raleway',
        fontSize: '4rem',
        fontWeight: 200,
        textTransform: 'uppercase',
      },
      h2: {
        fontFamily: 'Raleway',
        fontSize: '2.625rem',
        fontWeight: 300,
        textTransform: 'uppercase',
      },
      h3: {
        fontFamily: 'Raleway',
        fontSize: '2.375rem',
        fontWeight: 500,
      },
      h4: {
        fontFamily: 'Raleway',
        fontSize: '2rem',
        fontWeight: 500,
      },
      h5: {
        fontFamily: 'Raleway',
        fontSize: '1.7rem',
        fontWeight: 300,
      },
      h6: {
        fontFamily: 'Raleway',
        fontSize: '1.4rem',
        fontWeight: 500,
      },
      subtitle1: {
        fontFamily: 'Open Sans',
        fontSize: '0.938rem',
      },
      subtitle2: {
        fontFamily: 'Open Sans',
        fontSize: '0.813rem',
        fontWeight: 300,
      },
      overline: {
        fontFamily: 'Open Sans',
      },
      body1: {
        fontFamily: 'Open Sans',
        fontSize: '1rem',
      },
      body2: {
        fontFamily: 'Open Sans',
        fontSize: '0.938rem',
      },
      caption: {
        fontFamily: 'Open Sans',
      },
    },
  };

  const theme =
    mode === 'light'
      ? deepmerge(themeOptions, lightThemeOverrides)
      : deepmerge(themeOptions, darkThemeOverrides);

  return responsiveFontSizes(createTheme(theme));
};
