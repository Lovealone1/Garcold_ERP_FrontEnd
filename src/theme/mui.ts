"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Tema de MUI para Tienda Garcold.
 *
 * Existe por dos razones concretas:
 *
 * 1. Breakpoints. MUI trae 600/900/1200 y Tailwind usa 640/768/1024. La app
 *    mezcla los dos sistemas en la misma pantalla, así que había franjas de
 *    40-200px donde media página había cambiado de layout y la otra media no.
 *    Aquí se alinean con Tailwind y el desfase desaparece.
 *
 * 2. Paleta. Sin tema, MUI corría en su modo claro por defecto sobre una app
 *    oscura, y cada instancia tenía que repintarse a mano con `sx`. Los
 *    valores de abajo son los mismos tokens `--tg-*` de globals.css, en hex
 *    para que MUI pueda derivar sus propias variantes. Los `sx` existentes
 *    siguen teniendo prioridad, así que lo que ya estaba pintado no cambia:
 *    lo que cambia es todo lo que hasta ahora salía claro por descuido
 *    (menús de Select, poppers de Autocomplete, Paper, Snackbar…).
 *
 * `colorSchemeSelector: "class"` hace que MUI emita sus variables bajo `.dark`,
 * que es exactamente la clase que la app ya conmuta sobre <html>.
 */

// Espejo de los tokens de src/styles/globals.css. Si cambias uno allá,
// cámbialo aquí.
const light = {
  bg: "#ffffff",
  fg: "#0b0b0d",
  muted: "#6b7280",
  border: "#cacaca",
  primary: "#16a34a",
  primaryFg: "#ffffff",
  cardBg: "#ffffff",
  panelBg: "#ebebeb",
};

const dark = {
  bg: "#131313",
  fg: "#e5e5e5",
  muted: "#a3a3a3",
  border: "#2a2f2a",
  primary: "#22c55e",
  primaryFg: "#0b0b0d",
  cardBg: "#131313",
  panelBg: "#101010",
};

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  // Tiene que ser "light": la app conmuta el tema añadiendo y quitando la clase
  // `dark` de <html>, y nunca añade una clase `light`. Con el esquema por
  // defecto en dark, las variables oscuras quedarían en `:root` y el modo claro
  // —que se representa por ausencia de clase— seguiría viéndose oscuro en todo
  // lo que pinta MUI. Con "light" en `:root` y `.dark` sobreescribiendo encima,
  // el mapeo coincide exactamente con lo que hace el toggle.
  defaultColorScheme: "light",

  breakpoints: {
    // Alineados con tailwind.config.js / los prefijos sm: md: lg: xl:
    values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 },
  },

  shape: { borderRadius: 8 },

  typography: {
    fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
  },

  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: { main: light.primary, contrastText: light.primaryFg },
        divider: light.border,
        background: { default: light.bg, paper: light.panelBg },
        text: { primary: light.fg, secondary: light.muted },
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: { main: dark.primary, contrastText: dark.primaryFg },
        divider: dark.border,
        background: { default: dark.bg, paper: dark.panelBg },
        text: { primary: dark.fg, secondary: dark.muted },
      },
    },
  },

  components: {
    // Los targets táctiles de MUI por defecto son cómodos en escritorio y
    // pequeños en un teléfono. 44px es el mínimo usable con el dedo.
    MuiIconButton: {
      styleOverrides: {
        sizeSmall: { minWidth: 36, minHeight: 36 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    // Sin esto el popper del Autocomplete y el menú del Select heredaban el
    // Paper claro por defecto.
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

export default theme;
