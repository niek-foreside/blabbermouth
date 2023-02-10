import { GlobalContextProvider } from "@/context/global";
import "@/styles/globals.css";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { AppProps } from "next/app";
import { customTheme } from "theme/theme";
import createEmotionCache from "../styles/createEmotionCache";

interface CustomAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

// Create the Emotion Cache
const clientSideEmotionCache = createEmotionCache();

function AppContent({ Component, pageProps }: CustomAppProps) {
  const theme = customTheme("light");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default function CustomApp(props: CustomAppProps) {
  const { emotionCache = clientSideEmotionCache } = props;

  return (
    <CacheProvider value={emotionCache}>
      <main>
        <GlobalContextProvider>
          <AppContent {...props} />
        </GlobalContextProvider>
      </main>
    </CacheProvider>
  );
}
