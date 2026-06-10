// FIFA World Cup 2026 — official broadcasters only (must-have 25 IPTV channels).
// channelIds resolve against https://iptv-org.github.io/api at runtime.
// externalUrl = official stream with no embeddable community feed.
export const WC_REGIONS = [
  {
    code: "UK",
    name: "United Kingdom",
    flag: "🇬🇧",
    coverage: [
      { channel: "BBC One", role: "Main live World Cup 2026 matches" },
      { channel: "ITV1", role: "Co-broadcaster — live matches" },
      { channel: "BBC iPlayer", role: "Streams all BBC World Cup matches" },
      { channel: "ITVX", role: "Streams all ITV World Cup matches" },
    ],
    broadcasters: [
      {
        name: "BBC One",
        channelIds: ["BBCOne.uk"],
        externalUrl: "https://www.bbc.co.uk/iplayer/channels/bbc-one",
        note: "Main live World Cup 2026 matches",
      },
      {
        name: "ITV1",
        channelIds: ["ITV1.uk"],
        externalUrl: "https://www.itv.com/watch",
        note: "Co-broadcaster — live matches",
      },
      {
        name: "BBC iPlayer",
        externalUrl: "https://www.bbc.co.uk/iplayer",
        note: "All BBC World Cup 2026 matches — UK TV licence required",
      },
      {
        name: "ITVX",
        externalUrl: "https://www.itv.com/watch",
        note: "All ITV World Cup 2026 matches",
      },
    ],
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    coverage: [
      { channel: "FOX", role: "English — main tournament coverage" },
      { channel: "FS1", role: "English — additional matches" },
      { channel: "Telemundo", role: "Spanish — full tournament" },
      { channel: "Universo", role: "Spanish — select matches" },
      { channel: "Peacock", role: "Streaming feed — English & Spanish" },
    ],
    broadcasters: [
      {
        name: "FOX",
        channelIds: ["Fox.us"],
        externalUrl: "https://www.foxsports.com/soccer/fifa-world-cup",
        note: "English — main World Cup 2026 coverage",
      },
      {
        name: "FS1",
        channelIds: ["FoxSports1.us"],
        note: "English — additional live matches",
      },
      {
        name: "Telemundo",
        channelIds: ["TelemundoAlDia.us"],
        note: "Spanish — full tournament coverage",
      },
      {
        name: "Universo",
        channelIds: ["NBCUniverso.us"],
        note: "Spanish — select matches",
      },
      {
        name: "Peacock",
        externalUrl: "https://www.peacocktv.com/sports",
        note: "Streaming feed — English & Spanish coverage",
      },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    coverage: [
      { channel: "TSN1", role: "Live matches — feed 1" },
      { channel: "TSN2", role: "Live matches — feed 2" },
      { channel: "TSN3", role: "Live matches — feed 3" },
      { channel: "TSN4", role: "Live matches — feed 4" },
      { channel: "TSN5", role: "Live matches — feed 5" },
      { channel: "CTV", role: "Full tournament coverage" },
    ],
    broadcasters: [
      { name: "TSN1", channelIds: ["TSN1.ca"], externalUrl: "https://www.tsn.ca", note: "Live World Cup 2026 — feed 1" },
      { name: "TSN2", channelIds: ["TSN2.ca"], externalUrl: "https://www.tsn.ca", note: "Live World Cup 2026 — feed 2" },
      { name: "TSN3", channelIds: ["TSN3.ca"], externalUrl: "https://www.tsn.ca", note: "Live World Cup 2026 — feed 3" },
      { name: "TSN4", channelIds: ["TSN4.ca"], externalUrl: "https://www.tsn.ca", note: "Live World Cup 2026 — feed 4" },
      { name: "TSN5", channelIds: ["TSN5.ca"], externalUrl: "https://www.tsn.ca", note: "Live World Cup 2026 — feed 5" },
      { name: "CTV", externalUrl: "https://www.ctv.ca", note: "Full World Cup 2026 tournament coverage" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    coverage: [
      { channel: "SBS", role: "Free-to-air — full tournament" },
      { channel: "SBS Viceland", role: "Additional World Cup coverage" },
      { channel: "SBS On Demand", role: "Stream all SBS World Cup matches" },
    ],
    broadcasters: [
      {
        name: "SBS",
        channelIds: ["SBS.au"],
        externalUrl: "https://www.sbs.com.au/sport",
        note: "Free-to-air — full World Cup 2026 tournament",
      },
      {
        name: "SBS Viceland",
        channelIds: ["SBSViceland.au"],
        externalUrl: "https://www.sbs.com.au/ondemand",
        note: "Additional World Cup 2026 coverage",
      },
      {
        name: "SBS On Demand",
        externalUrl: "https://www.sbs.com.au/ondemand",
        note: "Stream all SBS World Cup 2026 matches free",
      },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    coverage: [
      { channel: "ARD Das Erste", role: "Free-to-air — live matches" },
      { channel: "ZDF", role: "Free-to-air — live matches" },
      { channel: "MagentaTV", role: "Full tournament streaming" },
    ],
    broadcasters: [
      {
        name: "ARD Das Erste",
        channelIds: ["DasErste.de"],
        note: "Free-to-air — live World Cup 2026 matches",
      },
      {
        name: "ZDF",
        channelIds: ["ZDF.de"],
        externalUrl: "https://www.zdf.de/sport",
        note: "Free-to-air — live World Cup 2026 matches",
      },
      {
        name: "MagentaTV",
        externalUrl: "https://www.magentatv.de",
        note: "Full World Cup 2026 tournament coverage",
      },
    ],
  },
  {
    code: "MENA",
    name: "Middle East & North Africa",
    flag: "🌍",
    coverage: [
      { channel: "beIN SPORTS MENA HD", role: "Every World Cup 2026 match" },
      { channel: "beIN SPORTS XTRA", role: "Backup / free feed channels" },
    ],
    broadcasters: [
      {
        name: "beIN SPORTS MENA HD",
        channelIds: ["beINSports1.qa", "beINSportsEnglish1.qa", "beINSports.qa"],
        externalUrl: "https://www.bein.com",
        note: "Every World Cup 2026 match — official MENA rights holder",
      },
      {
        name: "beIN SPORTS XTRA",
        channelIds: ["beINSPORTSXTRA.us"],
        note: "Backup / free feed channels",
      },
    ],
  },
  {
    code: "MX",
    name: "Mexico",
    flag: "🇲🇽",
    coverage: [
      { channel: "Las Estrellas", role: "TelevisaUnivision — free-to-air matches" },
      { channel: "Canal 5", role: "TelevisaUnivision — free-to-air matches" },
      { channel: "TUDN", role: "TelevisaUnivision — sports coverage" },
      { channel: "Azteca 7", role: "TV Azteca — live matches" },
      { channel: "Azteca Uno", role: "TV Azteca — live matches" },
      { channel: "ViX", role: "Streaming — full tournament" },
    ],
    broadcasters: [
      {
        name: "Las Estrellas",
        channelIds: ["LasEstrellas.mx", "LasEstrellasLatinAmerica.mx"],
        note: "TelevisaUnivision — free-to-air World Cup 2026",
      },
      {
        name: "Canal 5",
        channelIds: ["Canal5.mx"],
        note: "TelevisaUnivision — free-to-air World Cup 2026",
      },
      {
        name: "TUDN",
        channelIds: ["TUDN.mx", "TUDN.us"],
        externalUrl: "https://www.tudn.com",
        note: "TelevisaUnivision — sports coverage",
      },
      {
        name: "Azteca 7",
        channelIds: ["Azteca7.mx"],
        note: "TV Azteca — live World Cup 2026 matches",
      },
      {
        name: "Azteca Uno",
        channelIds: ["AztecaUno.mx", "AztecaInternacional.mx"],
        note: "TV Azteca — live World Cup 2026 matches",
      },
      {
        name: "ViX",
        externalUrl: "https://vix.com",
        note: "TelevisaUnivision streaming — full tournament",
      },
    ],
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    coverage: [
      { channel: "M6", role: "Free-to-air — selected matches" },
      { channel: "beIN SPORTS France", role: "Full tournament (paid)" },
      { channel: "TF1", role: "Major matches — sublicensing TBA" },
    ],
    broadcasters: [
      {
        name: "M6",
        channelIds: ["M6.fr"],
        externalUrl: "https://www.6play.fr",
        note: "Free-to-air — selected World Cup 2026 matches",
      },
      {
        name: "beIN SPORTS France",
        channelIds: ["beINSportsFrench1.qa", "beINSportsFrench2.qa"],
        externalUrl: "https://www.beinsports.com/france/",
        note: "Full World Cup 2026 tournament — paid subscription",
      },
      {
        name: "TF1",
        channelIds: ["TF1.fr"],
        externalUrl: "https://www.tf1.fr",
        note: "Major matches — final sublicensing package TBA",
      },
    ],
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    coverage: [{ channel: "CazéTV", role: "Free full tournament — YouTube streaming feed" }],
    broadcasters: [
      {
        name: "CazéTV",
        channelIds: ["CazeTV.br"],
        externalUrl: "https://www.youtube.com/@cazetv",
        note: "Free full World Cup 2026 — YouTube streaming feed",
      },
    ],
  },
  {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    coverage: [{ channel: "CCTV-5", role: "China Sports — full World Cup 2026 coverage" }],
    broadcasters: [
      {
        name: "CCTV-5",
        channelIds: ["CCTV5.cn", "CCTV5Plus.cn"],
        externalUrl: "https://www.cctv.com",
        note: "China Sports — full World Cup 2026 coverage",
      },
    ],
  },
  {
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰",
    rightsNote:
      "Pakistan rights are often confirmed closer to tournament time. Sublicensing and streaming partners may change last minute.",
    coverage: [
      { channel: "PTV Sports", role: "Likely free-to-air official broadcaster" },
      { channel: "A Sports", role: "Expected ARY group sports rights partner" },
      { channel: "Streaming partners", role: "Regional deals TBA — evolving before kickoff" },
    ],
    broadcasters: [
      {
        name: "PTV Sports",
        channelIds: ["PTVSports.pk"],
        externalUrl: "https://www.ptv.com.pk/ptvsports",
        note: "Likely free-to-air official World Cup 2026 broadcaster",
      },
      {
        name: "A Sports",
        channelIds: ["FastSports.pk", "GeoSuper.pk"],
        externalUrl: "https://arysport.com.pk",
        note: "Expected ARY group partner — rights package TBA",
      },
      {
        name: "Tapmad",
        externalUrl: "https://www.tapmad.com",
        note: "Possible streaming partner — deal status evolving",
      },
    ],
  },
];
