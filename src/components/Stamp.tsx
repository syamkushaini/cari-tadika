import type { Dict } from "@/content/i18n";
import { stampIsPass, tone, type Stats } from "@/lib/scoring";

export function Stamp({ st, t }: { st: Stats; t: Dict }) {
  return (
    <div className="stamp" role="img" aria-label={t.stampAria(st.y, st.major)} style={{ color: `var(--${tone(st)})` }}>
      <b aria-hidden="true">{st.y}/9</b>
      <span aria-hidden="true">{stampIsPass(st) ? t.stampLulus : t.stampSemak}</span>
    </div>
  );
}
