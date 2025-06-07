import {
  IBM_Plex_Serif,
  Literata,
  Source_Serif_4,
  Tinos,
  Cormorant_Garamond,
} from "next/font/google";

// Font configurations
export const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-serif",
  display: "swap",
});

export const literata = Literata({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-literata",
  display: "swap",
});

export const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-source-serif-4",
  display: "swap",
});

export const tinos = Tinos({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-tinos",
  display: "swap",
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

// Font selection configuration
export type FontType =
  | "ibm-plex-serif"
  | "literata"
  | "source-serif-4"
  | "tinos"
  | "cormorant-garamond";

export const fontConfigs = {
  "ibm-plex-serif": {
    font: ibmPlexSerif,
    name: "IBM Plex Serif",
    description: "Professional & modern serif typeface designed by IBM",
    cssVariable: "--font-ibm-plex-serif",
    tailwindClass: "font-ibm-plex-serif",
  },
  literata: {
    font: literata,
    name: "Literata",
    description: "Google's modern book-type serif, used in Google Play Books",
    cssVariable: "--font-literata",
    tailwindClass: "font-literata",
  },
  "source-serif-4": {
    font: sourceSerif4,
    name: "Source Serif 4",
    description: "Adobe's open-source companion to Source Sans and Source Code",
    cssVariable: "--font-source-serif-4",
    tailwindClass: "font-source-serif-4",
  },
  tinos: {
    font: tinos,
    name: "Tinos",
    description:
      "Metric-compatible with Times New Roman, but more refined for digital display",
    cssVariable: "--font-tinos",
    tailwindClass: "font-tinos",
  },
  "cormorant-garamond": {
    font: cormorantGaramond,
    name: "Cormorant Garamond",
    description:
      "A stylized, elegant Garamond revival, better for headlines than body text",
    cssVariable: "--font-cormorant-garamond",
    tailwindClass: "font-cormorant-garamond",
  },
} as const;

// CHANGE THIS TO SWITCH FONTS EASILY
export const ACTIVE_FONT: FontType = "ibm-plex-serif";
// "ibm-plex-serif"
// "literata"
// "source-serif-4"
// "tinos"
// "cormorant-garamond"

export const getActiveFont = () => fontConfigs[ACTIVE_FONT];
export const getAllFonts = () =>
  Object.values(fontConfigs).map((config) => config.font);
export const getAllFontVariables = () =>
  Object.values(fontConfigs)
    .map((config) => config.font.variable)
    .join(" ");
