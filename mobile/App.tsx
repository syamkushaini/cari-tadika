import { IBMPlexMono_600SemiBold, IBMPlexMono_700Bold } from "@expo-google-fonts/ibm-plex-mono";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { Spectral_600SemiBold } from "@expo-google-fonts/spectral";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { listKindergartens } from "@/data/repository";
import { Finder } from "~/Finder";

export default function App() {
  const [loaded] = useFonts({
    Spectral_600SemiBold, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    IBMPlexMono_600SemiBold, IBMPlexMono_700Bold,
  });
  if (!loaded) return null; // native splash stays up until fonts are ready
  return (
    <SafeAreaProvider>
      <Finder kindergartens={listKindergartens()} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
