import { useColorScheme } from "react-native";

// Same case-file palette as the web tokens (light + dark).
const light = {
  bg: "#E2DDCC", surface: "#FBFAF4", surface2: "#EEE8D6", ink: "#1B2A26", muted: "#47524B", line: "#9C8F68",
  accent: "#1F6E43", accentInk: "#FBFAF4", accentSoft: "#DCE8DB", kraft: "#8A5E38", kraftInk: "#FBFAF4",
  flag: "#AC3324", flagBg: "#F3DCD4", unk: "#6E5216", unkBg: "#EFE1BC",
};
const dark: typeof light = {
  bg: "#141E1A", surface: "#1D2B26", surface2: "#25352F", ink: "#E7ECE6", muted: "#94A69B", line: "#546B5D",
  accent: "#5FC98F", accentInk: "#0B1613", accentSoft: "#1F392C", kraft: "#D6A96A", kraftInk: "#20160B",
  flag: "#F0917F", flagBg: "#3C221C", unk: "#E4C36B", unkBg: "#3A3016",
};
export type Colors = typeof light;
export const useColors = (): Colors => (useColorScheme() === "dark" ? dark : light);

export const font = {
  serif: "Spectral_600SemiBold",
  sans: "IBMPlexSans_400Regular", sansMed: "IBMPlexSans_500Medium", sansSemi: "IBMPlexSans_600SemiBold", sansBold: "IBMPlexSans_700Bold",
  mono: "IBMPlexMono_600SemiBold", monoBold: "IBMPlexMono_700Bold",
} as const;
