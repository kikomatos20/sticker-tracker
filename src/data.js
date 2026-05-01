export const TEAMS = [
  // FWC intro section — stickers FWC-00 through FWC-13 (00 is unique)
  { id:"FWC", name:"FIFA World Cup 2026", flag:"FWC", group:null, count:20, startAt:0 },

  // Group A
  { id:"MEX", name:"Mexico",             flag:"MEX", group:"A", count:20 },
  { id:"RSA", name:"South Africa",       flag:"RSA", group:"A", count:20 },
  { id:"KOR", name:"Korea Republic",     flag:"KOR", group:"A", count:20 },
  { id:"CZE", name:"Czechia",            flag:"CZE", group:"A", count:20 },

  // Group B
  { id:"CAN", name:"Canada",             flag:"CAN", group:"B", count:20 },
  { id:"BIH", name:"Bosnia-Herzegovina", flag:"BIH", group:"B", count:20 },
  { id:"QAT", name:"Qatar",              flag:"QAT", group:"B", count:20 },
  { id:"SUI", name:"Switzerland",        flag:"SUI", group:"B", count:20 },

  // Group C
  { id:"BRA", name:"Brazil",             flag:"BRA", group:"C", count:20 },
  { id:"MAR", name:"Morocco",            flag:"MAR", group:"C", count:20 },
  { id:"HAI", name:"Haiti",              flag:"HAI", group:"C", count:20 },
  { id:"SCO", name:"Scotland",           flag:"SCO", group:"C", count:20 },

  // Group D
  { id:"USA", name:"United States",      flag:"USA", group:"D", count:20 },
  { id:"PAR", name:"Paraguay",           flag:"PAR", group:"D", count:20 },
  { id:"AUS", name:"Australia",          flag:"AUS", group:"D", count:20 },
  { id:"TUR", name:"Turkiye",            flag:"TUR", group:"D", count:20 },

  // Group E
  { id:"GER", name:"Germany",            flag:"GER", group:"E", count:20 },
  { id:"CUW", name:"Curacao",            flag:"CUW", group:"E", count:20 },
  { id:"CIV", name:"Cote d'Ivoire",      flag:"CIV", group:"E", count:20 },
  { id:"ECU", name:"Ecuador",            flag:"ECU", group:"E", count:20 },

  // Group F
  { id:"NED", name:"Netherlands",        flag:"NED", group:"F", count:20 },
  { id:"JPN", name:"Japan",              flag:"JPN", group:"F", count:20 },
  { id:"SWE", name:"Sweden",             flag:"SWE", group:"F", count:20 },
  { id:"TUN", name:"Tunisia",            flag:"TUN", group:"F", count:20 },

  // Group G
  { id:"BEL", name:"Belgium",            flag:"BEL", group:"G", count:20 },
  { id:"EGY", name:"Egypt",              flag:"EGY", group:"G", count:20 },
  { id:"IRN", name:"IR Iran",            flag:"IRN", group:"G", count:20 },
  { id:"NZL", name:"New Zealand",        flag:"NZL", group:"G", count:20 },

  // Group H
  { id:"ESP", name:"Spain",              flag:"ESP", group:"H", count:20 },
  { id:"CPV", name:"Cabo Verde",         flag:"CPV", group:"H", count:20 },
  { id:"KSA", name:"Saudi Arabia",       flag:"KSA", group:"H", count:20 },
  { id:"URU", name:"Uruguay",            flag:"URU", group:"H", count:20 },

  // Group I
  { id:"FRA", name:"France",             flag:"FRA", group:"I", count:20 },
  { id:"SEN", name:"Senegal",            flag:"SEN", group:"I", count:20 },
  { id:"IRQ", name:"Iraq",               flag:"IRQ", group:"I", count:20 },
  { id:"NOR", name:"Norway",             flag:"NOR", group:"I", count:20 },

  // Group J
  { id:"ARG", name:"Argentina",          flag:"ARG", group:"J", count:20 },
  { id:"ALG", name:"Algeria",            flag:"ALG", group:"J", count:20 },
  { id:"AUT", name:"Austria",            flag:"AUT", group:"J", count:20 },
  { id:"JOR", name:"Jordan",             flag:"JOR", group:"J", count:20 },

  // Group K
  { id:"POR", name:"Portugal",           flag:"POR", group:"K", count:20 },
  { id:"COD", name:"Congo DR",           flag:"COD", group:"K", count:20 },
  { id:"UZB", name:"Uzbekistan",         flag:"UZB", group:"K", count:20 },
  { id:"COL", name:"Colombia",           flag:"COL", group:"K", count:20 },

  // Group L
  { id:"ENG", name:"England",            flag:"ENG", group:"L", count:20 },
  { id:"CRO", name:"Croatia",            flag:"CRO", group:"L", count:20 },
  { id:"GHA", name:"Ghana",              flag:"GHA", group:"L", count:20 },
  { id:"PAN", name:"Panama",             flag:"PAN", group:"L", count:20 },
];

export const TOTAL_STICKERS = TEAMS.reduce((s, t) => s + t.count, 0);

// Parse "FWC-00", "ARG-3" etc → { teamId, num } or null
export function parseId(raw) {
  const str = raw.trim().toUpperCase();
  // Handle FWC-00 special case
  const m = str.match(/^([A-Z]+)-(\d+)$/);
  if (!m) return null;
  const team = TEAMS.find(t => t.id === m[1]);
  const num = parseInt(m[2]);
  const start = team?.startAt ?? 1;
  if (!team || num < start || num > (start + team.count - 1)) return null;
  return { teamId: m[1], num };
}

// Get all sticker numbers for a team
export function getTeamStickers(team) {
  const start = team.startAt ?? 1;
  return Array.from({ length: team.count }, (_, i) => start + i);
}
