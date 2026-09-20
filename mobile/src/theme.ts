import { useColorScheme } from "react-native";

// Case-file palette from the Claude Design canvas (light + dark).
const light = {
  bg: "#E2DDCC", surface: "#FBFAF4", surface2: "#EEE8D6", ink: "#1B2A26", muted: "#47524B", line: "#9C8F68",
  accent: "#1F6E43", accentInk: "#FFFFFF", accentSoft: "#DCE8DB", kraft: "#8A5E38", kraftInk: "#FFFFFF",
  flag: "#AC3324", flagInk: "#FFFFFF", flagBg: "#F3DCD4", unk: "#6E5216", unkBg: "#EFE1BC", ribbon: "#AC3324",
};
const dark: typeof light = {
  bg: "#141E1A", surface: "#1D2B26", surface2: "#263630", ink: "#E7ECE6", muted: "#A9B5AB", line: "#728578",
  accent: "#5FC98F", accentInk: "#0E1F17", accentSoft: "#1F3A2E", kraft: "#D6A96A", kraftInk: "#1B1408",
  flag: "#F0917F", flagInk: "#2B0F0A", flagBg: "#3E2521", unk: "#E4C36B", unkBg: "#3B3218", ribbon: "#C4432F",
};
export type Colors = typeof light;
export const useColors = (): Colors => (useColorScheme() === "dark" ? dark : light);

export const font = {
  serif: "Spectral_600SemiBold", serifBold: "Spectral_700Bold",
  sans: "IBMPlexSans_400Regular", sansItalic: "IBMPlexSans_400Regular_Italic", sansMed: "IBMPlexSans_500Medium",
  sansSemi: "IBMPlexSans_600SemiBold", sansBold: "IBMPlexSans_700Bold",
  monoMed: "IBMPlexMono_500Medium", mono: "IBMPlexMono_600SemiBold", monoBold: "IBMPlexMono_700Bold",
} as const;

/** Folder corners: small on the left, larger on the right (the design's "4px 12px 12px 4px"). */
export const folder = (left: number, right: number) => ({
  borderTopLeftRadius: left, borderBottomLeftRadius: left, borderTopRightRadius: right, borderBottomRightRadius: right,
});
