// The 9 red-flag criteria, ported verbatim from the prototype's CRITERIA array.
// Source: a kindergarten owner's public post (@dilakhairuddin on Threads), credited in-app.
import type { Lang } from "@/lib/types";

export type CriterionText = { t: string; short: string; tip: string };
export type Criterion = {
  k: string;
  major: boolean;
} & Record<Lang, CriterionText>;

export const CRITERIA: readonly Criterion[] = [
  {k:'reg', major:true,
   ms:{t:'Berdaftar dengan KPM', short:'Tak berdaftar KPM', tip:'Semak di portal ePrasekolah KPM (perlu log masuk dahulu). Tadika yang berdaftar akan tersenarai dalam carian.'},
   en:{t:'Registered with KPM', short:'Not registered with KPM', tip:'Check the KPM ePrasekolah portal (login required). Registered kindergartens are listed there.'}},
  {k:'ratio', major:false,
   ms:{t:'Nisbah guru : murid', short:'Murid terlalu ramai', tip:'Nisbah dianjurkan KPM ialah 1:10 hingga 1:15. Satu kelas 20 hingga 30 orang dengan seorang guru adalah red flag.'},
   en:{t:'Teacher-to-student ratio', short:'Too many students', tip:'KPM recommends a ratio of 1:10 to 1:15. A class of 20 to 30 with one teacher is a red flag.'}},
  {k:'curr', major:false,
   ms:{t:'Kurikulum jelas', short:'Kurikulum kabur', tip:'Tadika patut ikut KSPK. Yang lebih mahal mungkin tambah pendekatan lain (Montessori, Waldorf). Minta dokumen, dan jika mereka tak boleh terangkan, elakkan.'},
   en:{t:'Clear curriculum', short:'Curriculum unclear', tip:"Kindergartens should follow KSPK. Pricier ones may add another approach (Montessori, Waldorf). Ask for documentation, and avoid it if they can't explain it."}},
  {k:'safe', major:true,
   ms:{t:'Langkah keselamatan', short:'Keselamatan lemah', tip:'Wajib ada pintu masuk dan keluar berasingan (diperiksa Bomba). Tengok juga grill, pagar dan cara serahan anak semasa hantar dan ambil.'},
   en:{t:'Safety measures', short:'Weak safety measures', tip:'A separate entrance and exit is mandatory (inspected by the Fire Department). Also check the window grilles, gate, and how children are handed over at drop-off and pick-up.'}},
  {k:'clean', major:false,
   ms:{t:'Bersih dan teratur', short:'Kurang bersih', tip:'Perhatikan kelas, tandas dan kawasan makan semasa lawatan. Bahagian ini selalu terabai.'},
   en:{t:'Clean and orderly', short:'Not very clean', tip:'Look at the classroom, toilets and eating area during your visit. This part is often overlooked.'}},
  {k:'trial', major:false,
   ms:{t:'Ada sesi percubaan', short:'Tiada sesi percubaan', tip:'Minta sesi percubaan sebelum daftar, walaupun dikenakan caj harian. Berhati-hati jika didesak daftar cepat tanpa percubaan.'},
   en:{t:'Offers a trial session', short:'No trial session', tip:"Ask for a trial session before enrolling, even if it costs a daily fee. Be cautious if you're pressured to enrol quickly with none offered."}},
  {k:'assess', major:false,
   ms:{t:'Rekod pentaksiran', short:'Tiada rekod pentaksiran', tip:'Tadika berdaftar KPM ada buku rekod pentaksiran murid prasekolah. Minta untuk melihatnya. Ada tadika yang ada sistem pentaksiran sendiri, lagi bagus.'},
   en:{t:'Assessment records', short:'No assessment records', tip:'KPM-registered kindergartens keep a preschool pupil assessment record book. Ask to see it. Some also run their own assessment system, which is even better.'}},
  {k:'staff', major:false,
   ms:{t:'Guru tidak kerap bertukar', short:'Guru kerap bertukar', tip:'Guru yang kerap bertukar biasanya tanda masalah pengurusan. Tanya berapa lama guru sekarang sudah berkhidmat.'},
   en:{t:"Teachers don't change often", short:'Teachers change often', tip:"Teachers who change frequently usually signal a management problem. Ask how long the current teacher has been there."}},
  {k:'menu', major:false,
   ms:{t:'Menu makanan disediakan', short:'Tiada menu makanan', tip:'Tadika berdaftar KPM ada senarai menu yang dicop KPM. Minta lihat senarai itu, dan jika boleh, gambar makanan sebenar.'},
   en:{t:'Food menu provided', short:'No food menu', tip:'KPM-registered kindergartens have a KPM-stamped food menu list. Ask to see it, and if possible, photos of the actual meals.'}},
];

export const CRITERION_INDEX = Object.fromEntries(CRITERIA.map((c, i) => [c.k, i])) as Record<string, number>;
