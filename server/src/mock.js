// World Cup themed mock matches used when no RAPIDAPI_KEY is configured.
// The `direct` streams point at a public, CORS-enabled test HLS stream so the
// in-browser player actually plays something during local development.
const DEMO_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const DEMO_HLS_2 = "https://test-streams.mux.dev/pts_shift/master.m3u8";

const FLAG = (code) => `https://flagcdn.com/w160/${code}.png`;

function makeServers(seed) {
  return [
    {
      name: "Server 1 (HD)",
      url: seed % 2 === 0 ? DEMO_HLS : DEMO_HLS_2,
      header: { "user-agent": "Mozilla/5.0" },
      type: "direct",
    },
    {
      name: "Server 2 (Full HD)",
      url: DEMO_HLS,
      header: { "user-agent": "Mozilla/5.0" },
      type: "direct",
    },
    {
      name: "Server 3 (Backup)",
      url: DEMO_HLS_2,
      header: { "user-agent": "Mozilla/5.0", referer: "https://sportsportal.example.com/" },
      type: "referer",
    },
  ];
}

const TEAMS = [
  ["Argentina", "ar", "France", "fr", "Final"],
  ["Brazil", "br", "Spain", "es", "Semi-Final"],
  ["England", "gb-eng", "Portugal", "pt", "Quarter-Final"],
  ["Germany", "de", "Netherlands", "nl", "Quarter-Final"],
  ["Croatia", "hr", "Morocco", "ma", "Round of 16"],
  ["Italy", "it", "Belgium", "be", "Round of 16"],
  ["Uruguay", "uy", "Mexico", "mx", "Group Stage"],
  ["USA", "us", "Japan", "jp", "Group Stage"],
  ["Senegal", "sn", "South Korea", "kr", "Group Stage"],
  ["Denmark", "dk", "Switzerland", "ch", "Group Stage"],
];

const now = Math.floor(Date.now() / 1000);

const ALL = TEAMS.map((t, i) => {
  const [home, hc, away, ac, round] = t;
  const live = i < 4; // first four are "live"
  return {
    match_time: String(now + (live ? -2400 : (i - 3) * 3600)),
    match_status: live ? "live" : "vs",
    home_team_name: home,
    home_team_logo: FLAG(hc),
    homeTeamScore: live ? String((i + 1) % 4) : "",
    away_team_name: away,
    away_team_logo: FLAG(ac),
    awayTeamScore: live ? String(i % 3) : "",
    league_name: `FIFA World Cup · ${round}`,
    league_logo: "https://upload.wikimedia.org/wikipedia/en/e/e5/2022_FIFA_World_Cup.svg",
    servers: makeServers(i),
  };
});

export function getMockMatches({ status, page = 1, perPage = 20 } = {}) {
  let list = ALL;
  if (status === "live" || status === "vs") list = list.filter((m) => m.match_status === status);
  const total = list.length;
  const start = (page - 1) * perPage;
  const matches = list.slice(start, start + perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return {
    source: "mock",
    matches,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
