import { Finder } from "@/components/Finder";
import { listKindergartens } from "@/data/repository";

export default function Home() {
  return <Finder kindergartens={listKindergartens()} />;
}
