// The prototype's 9 sample kindergartens. Names are fictional; every row is source:'sample'.
// Compact rows are expanded into the full Kindergarten shape below.
import type { CurriculumCode, Kindergarten, KgModifier, KgType, Status } from "@/lib/types";
import { CRITERIA } from "@/content/criteria";
import { ratioStatus } from "./ratio";

type Row = {
  id: string; name: string; area: string; type: KgType; mod: KgModifier;
  lat: number; lng: number; fee: number; ratio: number; curr: CurriculumCode;
  open: string; close: string;
  /** prototype status string, one char per criterion; index 1 (ratio) is derived from `ratio`. */
  s: string;
  /** [registration, books/yr, uniform, activities/yr, transport/mo | null] */
  cost: [number, number, number, number, number | null];
};

const ROWS: Row[] = [
  {id:'t1', name:'Tadika Pelangi Ilmu', area:'Taman Uda', type:'private', mod:'none', lat:6.1395, lng:100.3550, fee:280, ratio:12, curr:'kspk', open:'07:30', close:'18:00', s:'y-yyyyyyy', cost:[300,250,150,150,120]},
  {id:'t2', name:'Tadika Bintang Kecil', area:'Stargate', type:'private', mod:'montessori', lat:6.1580, lng:100.3650, fee:650, ratio:8, curr:'kspk_montessori', open:'07:30', close:'18:30', s:'y-yyyyy?y', cost:[800,600,250,400,null]},
  {id:'t3', name:'Tadika Cahaya Nur', area:'Jalan Langgar', type:'private', mod:'islamic', lat:6.1105, lng:100.3900, fee:320, ratio:18, curr:'kspk_tahfiz', open:'07:30', close:'17:30', s:'y-yy?nyny', cost:[250,300,180,120,100]},
  {id:'t4', name:'Tadika Mutiara Mergong', area:'Mergong', type:'private', mod:'none', lat:6.1480, lng:100.3330, fee:250, ratio:22, curr:'none_stated', open:'07:00', close:'18:00', s:'?-nn?n?nn', cost:[200,150,120,0,100]},
  {id:'t5', name:'Tadika Tunas Harapan', area:'Anak Bukit', type:'government', mod:'none', lat:6.1860, lng:100.3720, fee:20, ratio:13, curr:'kspk', open:'08:00', close:'12:30', s:'y-yy?yyyy', cost:[0,50,100,30,null]},
  {id:'t6', name:'Tadika Kembara Minda', area:'Simpang Kuala', type:'private', mod:'waldorf', lat:6.1210, lng:100.3480, fee:580, ratio:10, curr:'kspk_waldorf', open:'07:30', close:'18:00', s:'y-yyyyyy?', cost:[700,500,200,350,150]},
  {id:'t7', name:'Tadika Seri Alor Merah', area:'Alor Merah', type:'private', mod:'none', lat:6.1650, lng:100.3920, fee:200, ratio:15, curr:'unclear', open:'07:30', close:'18:00', s:'n-n?yn?yn', cost:[150,150,100,50,80]},
  {id:'t8', name:'Tadika Al-Falah', area:'Kuala Kedah', type:'private', mod:'islamic', lat:6.1000, lng:100.3000, fee:300, ratio:14, curr:'kspk_fardu', open:'07:30', close:'17:30', s:'y-y?yy?yy', cost:[250,250,180,100,100]},
  {id:'t9', name:'Tadika Ceria Bestari', area:'Taman Golf', type:'private', mod:'none', lat:6.1320, lng:100.3800, fee:350, ratio:15, curr:'kspk', open:'07:30', close:'18:30', s:'y-yyy?yyy', cost:[350,300,150,200,120]},
];

const CHAR_STATUS: Record<string, Status> = { y: "ok", n: "flag", "?": "unsure" };

export { ratioStatus };

function expand(r: Row): Kindergarten {
  const statuses: Record<string, Status> = {};
  CRITERIA.forEach((c, i) => {
    statuses[c.k] = c.k === "ratio" ? ratioStatus(r.ratio) : CHAR_STATUS[r.s[i]];
  });
  const reg = statuses.reg;
  return {
    id: r.id, name: r.name, area: r.area, lat: r.lat, lng: r.lng,
    address: null, phone: null, placeId: null, fetchedAt: null,
    type: r.type, modifier: r.mod,
    monthlyFee: r.fee, teacherStudentRatio: r.ratio, curriculumCode: r.curr,
    hoursOpen: r.open, hoursClose: r.close,
    kpmRegistered: reg === "ok" ? true : reg === "flag" ? false : null,
    registrationFee: r.cost[0], annualBooksCost: r.cost[1], annualUniformCost: r.cost[2],
    annualActivitiesCost: r.cost[3], monthlyTransportCost: r.cost[4],
    billableMonths: 12,
    source: "sample",
    statuses,
  };
}

export const SAMPLE_KINDERGARTENS: readonly Kindergarten[] = ROWS.map(expand);
export const ALOR_SETAR_CENTRE = { lat: 6.1210, lng: 100.3680 };
