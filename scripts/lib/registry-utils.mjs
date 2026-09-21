/** "NO. 1, TAMAN BERLIAN, ANAK BUKIT" -> "TAMAN BERLIAN"; also kampung/pekan/bandar. */
export function locality(address) {
  const m = /\b(TAMAN|TMN\.?|KAMPUNG|KG\.?|PEKAN|BANDAR)\s+([A-Z0-9' ]+?)(?=,|\s+FASA\b|\s+FASA\d|\s+JALAN\b|\s+JLN\b|\s+\d{5}|\s+KEDAH\b|\s+ALOR\b|$)/.exec(address.toUpperCase());
  return m ? `${m[1].replace(/^TMN\.?$/, "TAMAN")} ${m[2].trim()}` : null;
}

const KEEP_UPPER = new Set(["ABIM", "CIC", "PLT", "LC", "II", "III", "IV", "SJK", "KPM", "PKNK", "MHJ", "LITC", "SSN", "TZU-CHI"]);
/** "TADIKA AL IMAN (C) ABIM" -> "Tadika Al Iman (C) ABIM". */
export function titleCase(s) {
  return s.toLowerCase().replace(/[a-z0-9'’][a-z0-9'’-]*/g, (w) => {
    const up = w.toUpperCase();
    if (KEEP_UPPER.has(up)) return up;
    if (/^[a-z]$/.test(w)) return up; // "(c)" -> "(C)"
    return w[0].toUpperCase() + w.slice(1);
  });
}
