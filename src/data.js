export const TEAMS = [
  { id:"INT",  name:"Introduction",   flag:"🌍", group:null, count:9  },
  { id:"MUS",  name:"FIFA Museum",    flag:"🏆", group:null, count:11 },
  { id:"USA",  name:"United States",  flag:"🇺🇸", group:"A",  count:20 },
  { id:"MEX",  name:"Mexico",         flag:"🇲🇽", group:"A",  count:20 },
  { id:"PAN",  name:"Panama",         flag:"🇵🇦", group:"A",  count:20 },
  { id:"CAN",  name:"Canada",         flag:"🇨🇦", group:"A",  count:20 },
  { id:"ARG",  name:"Argentina",      flag:"🇦🇷", group:"B",  count:20 },
  { id:"CHI",  name:"Chile",          flag:"🇨🇱", group:"B",  count:20 },
  { id:"PER",  name:"Peru",           flag:"🇵🇪", group:"B",  count:20 },
  { id:"AUS",  name:"Australia",      flag:"🇦🇺", group:"B",  count:20 },
  { id:"BRA",  name:"Brazil",         flag:"🇧🇷", group:"C",  count:20 },
  { id:"COL",  name:"Colombia",       flag:"🇨🇴", group:"C",  count:20 },
  { id:"PAR",  name:"Paraguay",       flag:"🇵🇾", group:"C",  count:20 },
  { id:"ECU",  name:"Ecuador",        flag:"🇪🇨", group:"C",  count:20 },
  { id:"FRA",  name:"France",         flag:"🇫🇷", group:"D",  count:20 },
  { id:"ENG",  name:"England",        flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", group:"D",  count:20 },
  { id:"GER",  name:"Germany",        flag:"🇩🇪", group:"D",  count:20 },
  { id:"POR",  name:"Portugal",       flag:"🇵🇹", group:"D",  count:20 },
  { id:"ESP",  name:"Spain",          flag:"🇪🇸", group:"E",  count:20 },
  { id:"ITA",  name:"Italy",          flag:"🇮🇹", group:"E",  count:20 },
  { id:"CRO",  name:"Croatia",        flag:"🇭🇷", group:"E",  count:20 },
  { id:"MAR",  name:"Morocco",        flag:"🇲🇦", group:"E",  count:20 },
  { id:"NED",  name:"Netherlands",    flag:"🇳🇱", group:"F",  count:20 },
  { id:"BEL",  name:"Belgium",        flag:"🇧🇪", group:"F",  count:20 },
  { id:"AUT",  name:"Austria",        flag:"🇦🇹", group:"F",  count:20 },
  { id:"TUR",  name:"Turkey",         flag:"🇹🇷", group:"F",  count:20 },
  { id:"SEN",  name:"Senegal",        flag:"🇸🇳", group:"G",  count:20 },
  { id:"NGR",  name:"Nigeria",        flag:"🇳🇬", group:"G",  count:20 },
  { id:"EGY",  name:"Egypt",          flag:"🇪🇬", group:"G",  count:20 },
  { id:"ALG",  name:"Algeria",        flag:"🇩🇿", group:"G",  count:20 },
  { id:"JPN",  name:"Japan",          flag:"🇯🇵", group:"H",  count:20 },
  { id:"KOR",  name:"South Korea",    flag:"🇰🇷", group:"H",  count:20 },
  { id:"SAU",  name:"Saudi Arabia",   flag:"🇸🇦", group:"H",  count:20 },
  { id:"IRN",  name:"Iran",           flag:"🇮🇷", group:"H",  count:20 },
  { id:"URU",  name:"Uruguay",        flag:"🇺🇾", group:"I",  count:20 },
  { id:"VEN",  name:"Venezuela",      flag:"🇻🇪", group:"I",  count:20 },
  { id:"BOL",  name:"Bolivia",        flag:"🇧🇴", group:"I",  count:20 },
  { id:"HON",  name:"Honduras",       flag:"🇭🇳", group:"I",  count:20 },
  { id:"POL",  name:"Poland",         flag:"🇵🇱", group:"J",  count:20 },
  { id:"SUI",  name:"Switzerland",    flag:"🇨🇭", group:"J",  count:20 },
  { id:"CZE",  name:"Czech Republic", flag:"🇨🇿", group:"J",  count:20 },
  { id:"SRB",  name:"Serbia",         flag:"🇷🇸", group:"J",  count:20 },
  { id:"WAL",  name:"Wales",          flag:"🏴󠁧󠁢󠁷󠁬󠁳󠁿", group:"K",  count:20 },
  { id:"SCO",  name:"Scotland",       flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", group:"K",  count:20 },
  { id:"ALB",  name:"Albania",        flag:"🇦🇱", group:"K",  count:20 },
  { id:"SVK",  name:"Slovakia",       flag:"🇸🇰", group:"K",  count:20 },
  { id:"CMR",  name:"Cameroon",       flag:"🇨🇲", group:"L",  count:20 },
  { id:"CIV",  name:"Ivory Coast",    flag:"🇨🇮", group:"L",  count:20 },
  { id:"GHA",  name:"Ghana",          flag:"🇬🇭", group:"L",  count:20 },
  { id:"TUN",  name:"Tunisia",        flag:"🇹🇳", group:"L",  count:20 },
];

export const TOTAL_STICKERS = TEAMS.reduce((s, t) => s + t.count, 0);

// Parse "ARG-3" → { teamId: "ARG", num: 3 } or null
export function parseId(raw) {
  const m = raw.trim().toUpperCase().match(/^([A-Z]+)-(\d+)$/);
  if (!m) return null;
  const team = TEAMS.find(t => t.id === m[1]);
  const num = parseInt(m[2]);
  if (!team || num < 1 || num > team.count) return null;
  return { teamId: m[1], num };
}
