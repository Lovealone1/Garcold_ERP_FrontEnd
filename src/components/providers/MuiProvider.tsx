"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/theme/mui";

/**
 * Emotion + tema de MUI para el App Router.
 *
 * `AppRouterCacheProvider` es la mitad importante: sin él, Emotion inyecta los
 * estilos de MUI en el cliente *después* de hidratar, así que el primer paint
 * salía con los componentes sin estilar y la pantalla se reacomodaba sola un
 * instante más tarde. Eso era buena parte del "las vistas se demoran en
 * enfocar".
 */
export default function MuiProvider({ children }: { children: React.ReactNode }) {
  // Sin `enableCssLayer`: hoy MUI y Tailwind conviven sin capas nativas y
  // meter una cambiaría quién gana en cientos de sitios a la vez. Este cambio
  // se limita a *cuándo* llegan los estilos, no a su prioridad.
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}
